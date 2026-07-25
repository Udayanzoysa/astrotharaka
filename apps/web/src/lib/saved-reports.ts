export type SavedGuestReport = {
  token: string;
  id?: string;
  title?: string | null;
  fullName?: string;
  createdAt: number;
  expiresAt?: number | null;
};

const KEY = "taraka_saved_guest_reports";
const MAX = 20;

export function listSavedGuestReports(): SavedGuestReport[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const data = JSON.parse(raw) as SavedGuestReport[];
    if (!Array.isArray(data)) return [];
    return data
      .filter((r) => r?.token)
      .sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0));
  } catch {
    return [];
  }
}

export function saveGuestReport(entry: Omit<SavedGuestReport, "createdAt"> & { createdAt?: number }) {
  if (typeof window === "undefined") return;
  const prev = listSavedGuestReports();
  const next: SavedGuestReport = {
    ...entry,
    createdAt: entry.createdAt ?? Date.now(),
  };
  const merged = [next, ...prev.filter((r) => r.token !== next.token)].slice(0, MAX);
  window.localStorage.setItem(KEY, JSON.stringify(merged));
}

export function removeSavedGuestReport(token: string) {
  if (typeof window === "undefined") return;
  const next = listSavedGuestReports().filter((r) => r.token !== token);
  window.localStorage.setItem(KEY, JSON.stringify(next));
}

export function guestReportPath(token: string) {
  return `/guest-report/${encodeURIComponent(token)}`;
}
