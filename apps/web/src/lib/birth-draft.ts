export type BirthDraft = {
  fullName?: string;
  email?: string;
  mobileNumber?: string;
  birthDate?: string;
  birthTime?: string;
  unknownBirthTime?: boolean;
  birthPlaceName?: string;
  gender?: string;
  latitude?: number | null;
  longitude?: number | null;
  language?: "si" | "en" | "ta";
  source?: "guest" | "profile" | "shop";
  updatedAt?: number;
};

const KEY = "taraka_birth_draft";

export function readBirthDraft(): BirthDraft | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as BirthDraft;
    if (!data || typeof data !== "object") return null;
    return data;
  } catch {
    return null;
  }
}

export function writeBirthDraft(partial: BirthDraft): BirthDraft {
  const prev = readBirthDraft() ?? {};
  const next: BirthDraft = {
    ...prev,
    ...partial,
    updatedAt: Date.now(),
  };
  if (typeof window !== "undefined") {
    window.localStorage.setItem(KEY, JSON.stringify(next));
  }
  return next;
}

export function clearBirthDraft() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(KEY);
}
