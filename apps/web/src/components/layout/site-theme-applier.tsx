"use client";

import { useEffect } from "react";
import { apiRequest } from "@/lib/api";
import { useUi } from "@/components/providers/ui-provider";

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
  const { applyDefaultLanguage } = useUi();

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
        if (data.branding.defaultLanguage) {
          applyDefaultLanguage(data.branding.defaultLanguage);
          root.lang = data.branding.defaultLanguage;
        }
      } catch {
        /* keep defaults when API unavailable */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [applyDefaultLanguage]);

  return null;
}

