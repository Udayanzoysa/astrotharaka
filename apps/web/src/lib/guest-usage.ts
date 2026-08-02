/** Guest fingerprint + free-preview helpers (server enforces; client mirrors for UX). */

const GUEST_KEY = "taraka_fp";
const USED_COUNT_KEY = "taraka_free_preview_used_count";
const LIMIT_KEY = "taraka_free_preview_limit";
/** Legacy boolean flag from one-time free preview — migrated on read. */
const LEGACY_USED_KEY = "taraka_free_preview_used";

/** Default until /free-preview/status or site-settings sync. */
export const DEFAULT_GUEST_FREE_LIMIT = 2;

export type GuestService = "horoscope" | "babyNames" | "porondam";

export type PendingCheckout = {
  packageId: string;
  packageCode?: string;
  packageName?: string;
  priceLkr?: number;
  returnTo?: string;
  savedAt: number;
};

export type FreePreviewStatus = {
  guestKey?: string;
  limit: number;
  used: number;
  remaining: number;
  windowHours?: number;
  hasUsedFreePreview?: boolean;
  canUseFreePreview?: boolean;
};

const PENDING_KEY = "taraka_pending_checkout";

function sessionStore(): Storage | null {
  if (typeof window === "undefined") return null;
  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
}

function localStore(): Storage | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function notifyUsageChanged() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event("taraka-guest-usage"));
}

/**
 * Browser-session guest key (sessionStorage).
 * New browser session → new key → fresh free-preview allowance (server still enforces window + soft IP cap).
 */
export function getOrCreateGuestKey(): string {
  const session = sessionStore();
  const local = localStore();
  if (!session && !local) return "";

  try {
    let key = session?.getItem(GUEST_KEY) || "";
    // Migrate prior localStorage fingerprint into this session once.
    if (!key && local) {
      const legacy = local.getItem(GUEST_KEY) || "";
      if (legacy && /^[a-zA-Z0-9_-]{8,64}$/.test(legacy)) {
        key = legacy;
        session?.setItem(GUEST_KEY, key);
      }
    }
    if (!key || !/^[a-zA-Z0-9_-]{8,64}$/.test(key)) {
      key =
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID().replace(/-/g, "")
          : `g${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
      session?.setItem(GUEST_KEY, key);
    }
    return key;
  } catch {
    return "";
  }
}

export function rememberGuestKey(key: string | null | undefined) {
  if (!key || !/^[a-zA-Z0-9_-]{8,64}$/.test(key)) return;
  sessionStore()?.setItem(GUEST_KEY, key);
}

export function getGuestFreeLimit(): number {
  const raw = sessionStore()?.getItem(LIMIT_KEY);
  const n = Number.parseInt(String(raw ?? ""), 10);
  if (Number.isFinite(n) && n >= 1) return n;
  return DEFAULT_GUEST_FREE_LIMIT;
}

export function getGuestUsedCount(): number {
  const session = sessionStore();
  if (!session) return 0;
  const raw = session.getItem(USED_COUNT_KEY);
  if (raw != null) {
    const n = Number.parseInt(raw, 10);
    return Number.isFinite(n) && n >= 0 ? n : 0;
  }
  // Migrate legacy one-shot flag
  if (localStore()?.getItem(LEGACY_USED_KEY) === "1" || session.getItem(LEGACY_USED_KEY) === "1") {
    session.setItem(USED_COUNT_KEY, "1");
    return 1;
  }
  return 0;
}

export function syncFreePreviewStatus(status: FreePreviewStatus) {
  const session = sessionStore();
  if (!session) return;
  if (status.guestKey) rememberGuestKey(status.guestKey);
  session.setItem(LIMIT_KEY, String(Math.max(1, status.limit)));
  session.setItem(USED_COUNT_KEY, String(Math.max(0, status.used)));
  notifyUsageChanged();
}

export function markFreePreviewUsedLocally() {
  const session = sessionStore();
  if (!session) return;
  const next = getGuestUsedCount() + 1;
  session.setItem(USED_COUNT_KEY, String(next));
  notifyUsageChanged();
}

export function hasUsedFreePreviewLocally(): boolean {
  return getGuestRemaining() <= 0;
}

export function canGuestUse(_service?: GuestService): boolean {
  return getGuestRemaining() > 0;
}

export function getGuestRemaining(_service?: GuestService): number {
  return Math.max(0, getGuestFreeLimit() - getGuestUsedCount());
}

export function consumeGuestUse(_service?: GuestService) {
  markFreePreviewUsedLocally();
  return { horoscope: 1, babyNames: 1, porondam: 1 };
}

export function savePendingCheckout(data: Omit<PendingCheckout, "savedAt">) {
  const payload: PendingCheckout = { ...data, savedAt: Date.now() };
  localStore()?.setItem(PENDING_KEY, JSON.stringify(payload));
  return payload;
}

export function readPendingCheckout(): PendingCheckout | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStore()?.getItem(PENDING_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as PendingCheckout;
  } catch {
    return null;
  }
}

export function clearPendingCheckout() {
  localStore()?.removeItem(PENDING_KEY);
}

/** @deprecated use getGuestFreeLimit() — kept for older imports */
export const GUEST_FREE_LIMIT = DEFAULT_GUEST_FREE_LIMIT;
