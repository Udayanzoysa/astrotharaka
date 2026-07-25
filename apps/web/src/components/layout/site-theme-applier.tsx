"use client";

import { useEffect } from "react";
import { apiRequest } from "@/lib/api";

type PublicSiteSettings = {
  branding: {
    colorPrimary: string;
    colorSecondary: string;
    colorAccent: string;
    buttonStyle: string;
    defaultLanguage: string;
  };
};

/** Applies admin branding theme tokens + default language to the document. */
export function SiteThemeApplier() {
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const data = await apiRequest<PublicSiteSettings>("/site-settings/public");
        if (cancelled) return;
        const root = document.documentElement;
        root.style.setProperty("--bg", data.branding.colorPrimary);
        root.style.setProperty("--accent", data.branding.colorAccent);
        root.style.setProperty("--accent-hover", data.branding.colorAccent);
        root.dataset.buttonStyle = data.branding.buttonStyle;
        if (!root.lang || root.lang === "en") {
          root.lang = data.branding.defaultLanguage || "en";
        }
      } catch {
        /* keep defaults when API unavailable */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return null;
}
