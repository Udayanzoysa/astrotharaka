/** Guest fingerprint + free-preview helpers (server enforces; client mirrors for UX). */

const GUEST_KEY = "taraka_fp";
const USED_KEY = "taraka_free_preview_used";

export type GuestService = "horoscope" | "babyNames" | "porondam";

export type PendingCheckout = {
  packageId: string;
  packageCode?: string;
  packageName?: string;
  priceLkr?: number;
  returnTo?: string;
  savedAt: number;
};

const PENDING_KEY = "taraka_pending_checkout";

export function getOrCreateGuestKey(): string {
  if (typeof window === "undefined") return "";
  try {
    let key = window.localStorage.getItem(GUEST_KEY);
    if (!key || !/^[a-zA-Z0-9_-]{8,64}$/.test(key)) {
      key =
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID().replace(/-/g, "")
          : `g${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
      window.localStorage.setItem(GUEST_KEY, key);
    }
    return key;
  } catch {
    return "";
  }
}

export function rememberGuestKey(key: string | null | undefined) {
  if (typeof window === "undefined" || !key) return;
  if (!/^[a-zA-Z0-9_-]{8,64}$/.test(key)) return;
  window.localStorage.setItem(GUEST_KEY, key);
}

export function markFreePreviewUsedLocally() {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(USED_KEY, "1");
  window.dispatchEvent(new Event("taraka-guest-usage"));
}

export function hasUsedFreePreviewLocally(): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(USED_KEY) === "1";
}

/** @deprecated use hasUsedFreePreviewLocally — kept for banner compatibility */
export function canGuestUse(_service?: GuestService): boolean {
  return !hasUsedFreePreviewLocally();
}

export function getGuestRemaining(_service?: GuestService): number {
  return hasUsedFreePreviewLocally() ? 0 : 1;
}

export function consumeGuestUse(_service?: GuestService) {
  markFreePreviewUsedLocally();
  return { horoscope: 1, babyNames: 1, porondam: 1 };
}

export function savePendingCheckout(data: Omit<PendingCheckout, "savedAt">) {
  const payload: PendingCheckout = { ...data, savedAt: Date.now() };
  window.localStorage.setItem(PENDING_KEY, JSON.stringify(payload));
  return payload;
}

export function readPendingCheckout(): PendingCheckout | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(PENDING_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as PendingCheckout;
  } catch {
    return null;
  }
}

export function clearPendingCheckout() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(PENDING_KEY);
}

export const GUEST_FREE_LIMIT = 1;
