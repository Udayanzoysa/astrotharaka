"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { hasUsedFreePreviewLocally } from "@/lib/guest-usage";

/**
 * True after the one free preview is used, or when the visitor is logged in
 * (logged-in users no longer see guest "free preview" copy).
 */
export function usePreviewConsumed(): boolean {
  const { user } = useAuth();
  const [consumed, setConsumed] = useState(() => {
    if (typeof window === "undefined") return false;
    return hasUsedFreePreviewLocally();
  });

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

  return consumed;
}
