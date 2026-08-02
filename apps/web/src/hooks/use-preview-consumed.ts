"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { apiRequest } from "@/lib/api";
import {
  hasUsedFreePreviewLocally,
  syncFreePreviewStatus,
  type FreePreviewStatus,
} from "@/lib/guest-usage";

/**
 * True when guest free-preview allowance is exhausted, or when the visitor is logged in
 * (logged-in users no longer see guest "free preview" copy).
 *
 * Always starts as `false` so SSR and the first client render match (avoids hydration mismatch).
 */
export function usePreviewConsumed(): boolean {
  const { user } = useAuth();
  const [consumed, setConsumed] = useState(false);

  useEffect(() => {
    const sync = () => {
      setConsumed(
        hasUsedFreePreviewLocally() || Boolean(user?.hasUsedFreePreview) || Boolean(user),
      );
    };
    sync();
    window.addEventListener("taraka-guest-usage", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("taraka-guest-usage", sync);
      window.removeEventListener("storage", sync);
    };
  }, [user]);

  useEffect(() => {
    if (user) return;
    let cancelled = false;
    void (async () => {
      try {
        const status = await apiRequest<FreePreviewStatus>("/free-preview/status");
        if (cancelled) return;
        syncFreePreviewStatus(status);
      } catch {
        // Keep local mirror if status endpoint is unavailable.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  return consumed;
}
