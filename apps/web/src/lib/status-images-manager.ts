import fs from "fs";
import path from "path";
import AdmZip from "adm-zip";

export type TimeSlot = "morning" | "afternoon" | "evening";

export interface StatusImagesState {
  queue: string[];
  currentIndex: number;
  used: string[];
  lastPostedAt?: string;
  lastPostedSlot?: TimeSlot;
  lastPostedFile?: string;
  cycleCount: number;
  updatedAt: string;
}

export interface StatusImageFileItem {
  fileName: string;
  isUsed: boolean;
  queuePosition: number | null; // 1-based position in queue if unused
  sizeBytes: number;
  url: string;
}

export interface StatusImagesSummary {
  directory: string;
  totalImages: number;
  remainingCount: number;
  usedCount: number;
  currentIndex: number;
  cycleCount: number;
  lastPostedFile?: string;
  lastPostedSlot?: TimeSlot;
  lastPostedAt?: string;
  files: StatusImageFileItem[];
}

export interface LoadedStatusImage {
  buffer: Buffer;
  fileName: string;
  mimeType: string;
  queuePosition: number;
  remainingAfter: number;
}

const VALID_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp"];
const STATE_FILENAME = "status-images-state.json";

/**
 * Locate the status-images directory across candidate locations
 */
export function getStatusImagesDir(): string {
  const candidateDirs = [
    path.join(process.cwd(), "public/brand/status-images"),
    path.join(process.cwd(), "apps/web/public/brand/status-images"),
    "/app/apps/web/public/brand/status-images",
    "/app/public/brand/status-images",
  ];

  for (const dir of candidateDirs) {
    if (fs.existsSync(dir)) {
      return dir;
    }
  }

  // Fallback: create in primary location
  const primary = path.join(process.cwd(), "public/brand/status-images");
  if (!fs.existsSync(primary)) {
    try {
      fs.mkdirSync(primary, { recursive: true });
    } catch {
      // ignore
    }
  }
  return primary;
}

/**
 * Fisher-Yates shuffle with optional avoidance of first element
 */
function shuffle<T>(array: T[], avoidFirstItem?: T): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }

  // If first item matches avoidFirstItem and we have more than 1 item, swap it
  if (arr.length > 1 && avoidFirstItem && arr[0] === avoidFirstItem) {
    const swapIdx = Math.floor(Math.random() * (arr.length - 1)) + 1;
    [arr[0], arr[swapIdx]] = [arr[swapIdx], arr[0]];
  }

  return arr;
}

/**
 * Get all valid image files currently in the directory
 */
export function listPhysicalImageFiles(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  try {
    return fs
      .readdirSync(dir)
      .filter((file) => {
        if (file.startsWith(".") || file === STATE_FILENAME || file === "README.md") return false;
        const ext = path.extname(file).toLowerCase();
        return VALID_EXTENSIONS.includes(ext);
      })
      .sort();
  } catch (err) {
    console.warn("[StatusImages] Failed to read directory:", err);
    return [];
  }
}

/**
 * Read the current state file, or return null if not found/corrupted
 */
function readStateFile(dir: string): StatusImagesState | null {
  const statePath = path.join(dir, STATE_FILENAME);
  if (!fs.existsSync(statePath)) return null;

  try {
    const raw = fs.readFileSync(statePath, "utf-8");
    const data = JSON.parse(raw) as StatusImagesState;
    if (Array.isArray(data.queue) && typeof data.currentIndex === "number") {
      return data;
    }
  } catch (err) {
    console.warn("[StatusImages] Failed to parse state file, reinitializing:", err);
  }
  return null;
}

/**
 * Persist state file to disk
 */
function writeStateFile(dir: string, state: StatusImagesState): void {
  const statePath = path.join(dir, STATE_FILENAME);
  try {
    state.updatedAt = new Date().toISOString();
    fs.writeFileSync(statePath, JSON.stringify(state, null, 2), "utf-8");
  } catch (err) {
    console.error("[StatusImages] Failed to write state file:", err);
  }
}

/**
 * Synchronize state file with physical files on disk:
 * - Detects deleted files and cleans them from queue and used
 * - Detects newly added files and shuffles them into remaining queue
 * - Initializes fresh shuffled queue if state doesn't exist
 */
export function getOrSyncState(dir: string): { state: StatusImagesState; files: string[] } {
  const physicalFiles = listPhysicalImageFiles(dir);
  const physicalSet = new Set(physicalFiles);

  let state = readStateFile(dir);

  if (!state || !Array.isArray(state.queue) || state.queue.length === 0) {
    // Initial creation: shuffle all physical files
    const shuffled = shuffle(physicalFiles);
    state = {
      queue: shuffled,
      currentIndex: 0,
      used: [],
      cycleCount: 1,
      updatedAt: new Date().toISOString(),
    };
    writeStateFile(dir, state);
    return { state, files: physicalFiles };
  }

  // Filter out any files that were physically removed from disk
  const cleanedQueue = state.queue.filter((f) => physicalSet.has(f));
  const cleanedUsed = state.used.filter((f) => physicalSet.has(f));

  // Find newly added files on disk not yet in queue or used
  const knownSet = new Set([...cleanedQueue, ...cleanedUsed]);
  const newFiles = physicalFiles.filter((f) => !knownSet.has(f));

  let modified = false;

  if (cleanedQueue.length !== state.queue.length || cleanedUsed.length !== state.used.length) {
    state.queue = cleanedQueue;
    state.used = cleanedUsed;
    if (state.currentIndex > state.queue.length) {
      state.currentIndex = state.queue.length;
    }
    modified = true;
  }

  if (newFiles.length > 0) {
    // Shuffle the new files and append to the remaining part of queue
    const shuffledNew = shuffle(newFiles);
    state.queue.push(...shuffledNew);
    modified = true;
  }

  if (modified) {
    writeStateFile(dir, state);
  }

  return { state, files: physicalFiles };
}

/**
 * Pick the NEXT image in sequence from the shuffled queue with STRICT ONE-TIME USE.
 * If all images have been used, reshuffles the pool, increments cycleCount, and starts a fresh round.
 */
export function getNextStatusImage(slot: TimeSlot): LoadedStatusImage | null {
  const dir = getStatusImagesDir();
  const { state, files } = getOrSyncState(dir);

  if (files.length === 0) {
    console.warn("[StatusImages] No status images found in directory:", dir);
    return null;
  }

  // Check if we reached the end of current cycle (all images consumed once)
  if (state.currentIndex >= state.queue.length) {
    console.log(
      `[StatusImages] All ${state.queue.length} images have been used once in Cycle #${state.cycleCount}! Starting fresh reshuffled cycle...`
    );
    const newShuffled = shuffle(files, state.lastPostedFile);
    state.queue = newShuffled;
    state.currentIndex = 0;
    state.used = [];
    state.cycleCount = (state.cycleCount || 1) + 1;
  }

  // Find the next available file that physically exists
  let chosenFile: string | null = null;
  while (state.currentIndex < state.queue.length) {
    const candidate = state.queue[state.currentIndex];
    const filePath = path.join(dir, candidate);
    if (fs.existsSync(filePath)) {
      chosenFile = candidate;
      break;
    } else {
      // File missing on disk, skip it
      console.warn(`[StatusImages] File in queue not found on disk: ${candidate}, skipping.`);
      state.currentIndex++;
    }
  }

  if (!chosenFile) {
    // If still nothing found, reshuffle existing physical files
    if (files.length > 0) {
      state.queue = shuffle(files, state.lastPostedFile);
      state.currentIndex = 0;
      state.used = [];
      chosenFile = state.queue[0];
    } else {
      return null;
    }
  }

  const filePath = path.join(dir, chosenFile);
  const buffer = fs.readFileSync(filePath);
  const ext = path.extname(chosenFile).toLowerCase();

  let mimeType = "image/jpeg";
  if (ext === ".png") mimeType = "image/png";
  else if (ext === ".webp") mimeType = "image/webp";

  // Mark as used and advance pointer
  state.currentIndex++;
  if (!state.used.includes(chosenFile)) {
    state.used.push(chosenFile);
  }
  state.lastPostedAt = new Date().toISOString();
  state.lastPostedSlot = slot;
  state.lastPostedFile = chosenFile;

  writeStateFile(dir, state);

  const remainingAfter = Math.max(0, state.queue.length - state.currentIndex);
  console.log(
    `[StatusImages] Selected image: "${chosenFile}" for slot "${slot}". (Cycle: #${state.cycleCount}, Position: ${state.currentIndex}/${state.queue.length}, Remaining unused: ${remainingAfter})`
  );

  return {
    buffer,
    fileName: chosenFile,
    mimeType,
    queuePosition: state.currentIndex,
    remainingAfter,
  };
}

/**
 * Reshuffle only the remaining (unused) images in the queue
 */
export function reshuffleRemainingQueue(): StatusImagesSummary {
  const dir = getStatusImagesDir();
  const { state } = getOrSyncState(dir);

  // Past elements (used)
  const consumed = state.queue.slice(0, state.currentIndex);
  // Remaining elements (unused)
  const remaining = state.queue.slice(state.currentIndex);

  const newlyShuffledRemaining = shuffle(remaining, state.lastPostedFile);
  state.queue = [...consumed, ...newlyShuffledRemaining];
  writeStateFile(dir, state);

  return getStatusImagesSummary();
}

/**
 * Reset all images to unused and reshuffle entire queue from scratch
 */
export function resetAndReshuffleAll(): StatusImagesSummary {
  const dir = getStatusImagesDir();
  const physicalFiles = listPhysicalImageFiles(dir);

  const newQueue = shuffle(physicalFiles);
  const state: StatusImagesState = {
    queue: newQueue,
    currentIndex: 0,
    used: [],
    cycleCount: 1,
    updatedAt: new Date().toISOString(),
  };

  writeStateFile(dir, state);
  return getStatusImagesSummary();
}

/**
 * Extract an uploaded ZIP file and update photos directory.
 * @param zipBuffer Raw buffer of uploaded .zip file
 * @param mode "replace" to replace existing images or "append" to add to existing
 */
export async function updatePhotosFromZip(
  zipBuffer: Buffer,
  mode: "replace" | "append" = "replace"
): Promise<{
  success: boolean;
  extractedCount: number;
  totalImages: number;
  extractedFiles: string[];
  summary: StatusImagesSummary;
}> {
  const dir = getStatusImagesDir();
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const zip = new AdmZip(zipBuffer);
  const zipEntries = zip.getEntries();

  const validEntries = zipEntries.filter((entry) => {
    if (entry.isDirectory) return false;
    const name = entry.entryName;
    if (name.includes("__MACOSX") || path.basename(name).startsWith(".")) return false;
    const ext = path.extname(name).toLowerCase();
    return VALID_EXTENSIONS.includes(ext);
  });

  if (validEntries.length === 0) {
    throw new Error(
      "No valid image files (.jpg, .jpeg, .png, .webp) found inside the uploaded ZIP archive."
    );
  }

  // If replacing, clean existing image files (preserve README.md and other non-image files)
  if (mode === "replace") {
    const existing = listPhysicalImageFiles(dir);
    for (const file of existing) {
      try {
        fs.unlinkSync(path.join(dir, file));
      } catch (err) {
        console.warn(`[StatusImages] Failed to delete existing file ${file}:`, err);
      }
    }
  }

  const extractedFiles: string[] = [];
  let fileIndex = 1;

  for (const entry of validEntries) {
    const originalBase = path.basename(entry.entryName);
    const ext = path.extname(originalBase).toLowerCase();

    // Sanitize filename: alphanumeric, dashes, underscores, spaces
    let cleanBase = originalBase
      .replace(/[^a-zA-Z0-9_\-. ()]/g, "_")
      .trim();

    if (!cleanBase || cleanBase === ext) {
      cleanBase = `image_${String(fileIndex).padStart(2, "0")}${ext}`;
    }

    // Ensure uniqueness
    let targetFileName = cleanBase;
    let counter = 1;
    while (fs.existsSync(path.join(dir, targetFileName))) {
      const nameWithoutExt = path.basename(cleanBase, ext);
      targetFileName = `${nameWithoutExt}_${counter}${ext}`;
      counter++;
    }

    const data = entry.getData();
    fs.writeFileSync(path.join(dir, targetFileName), data);
    extractedFiles.push(targetFileName);
    fileIndex++;
  }

  // After extraction, reset and re-shuffle the entire pool
  const allCurrentFiles = listPhysicalImageFiles(dir);
  const shuffledQueue = shuffle(allCurrentFiles);

  const newState: StatusImagesState = {
    queue: shuffledQueue,
    currentIndex: 0,
    used: [],
    cycleCount: 1,
    updatedAt: new Date().toISOString(),
  };

  writeStateFile(dir, newState);

  const summary = getStatusImagesSummary();

  return {
    success: true,
    extractedCount: extractedFiles.length,
    totalImages: allCurrentFiles.length,
    extractedFiles,
    summary,
  };
}

/**
 * Get detailed summary of images, queue, and usage for Admin Dashboard
 */
export function getStatusImagesSummary(): StatusImagesSummary {
  const dir = getStatusImagesDir();
  const { state, files } = getOrSyncState(dir);

  const usedSet = new Set(state.used || []);
  const remainingQueue = state.queue.slice(state.currentIndex);
  const queuePositionMap = new Map<string, number>();

  remainingQueue.forEach((filename, idx) => {
    queuePositionMap.set(filename, idx + 1);
  });

  const fileItems: StatusImageFileItem[] = files.map((fileName) => {
    const filePath = path.join(dir, fileName);
    let sizeBytes = 0;
    try {
      const stat = fs.statSync(filePath);
      sizeBytes = stat.size;
    } catch {
      // ignore
    }

    const isUsed = usedSet.has(fileName);
    const queuePosition = queuePositionMap.get(fileName) ?? null;

    return {
      fileName,
      isUsed,
      queuePosition,
      sizeBytes,
      url: `/brand/status-images/${encodeURIComponent(fileName)}`,
    };
  });

  // Sort files: unused first (by queue position), then used
  fileItems.sort((a, b) => {
    if (a.isUsed !== b.isUsed) {
      return a.isUsed ? 1 : -1;
    }
    if (a.queuePosition !== null && b.queuePosition !== null) {
      return a.queuePosition - b.queuePosition;
    }
    return a.fileName.localeCompare(b.fileName);
  });

  const remainingCount = Math.max(0, state.queue.length - state.currentIndex);

  return {
    directory: dir,
    totalImages: files.length,
    remainingCount,
    usedCount: state.used.length,
    currentIndex: state.currentIndex,
    cycleCount: state.cycleCount || 1,
    lastPostedFile: state.lastPostedFile,
    lastPostedSlot: state.lastPostedSlot,
    lastPostedAt: state.lastPostedAt,
    files: fileItems,
  };
}
