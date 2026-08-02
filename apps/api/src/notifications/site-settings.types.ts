export const BRANDING_SETTING_KEYS = {
  siteName: "branding.siteName",
  description: "branding.description",
  slogan: "branding.slogan",
  logoUrl: "branding.logoUrl",
  faviconUrl: "branding.faviconUrl",
  h1Text: "branding.h1Text",
  colorPrimary: "branding.colorPrimary",
  colorSecondary: "branding.colorSecondary",
  colorAccent: "branding.colorAccent",
  buttonStyle: "branding.buttonStyle",
  defaultLanguage: "branding.defaultLanguage",
} as const;

export const SEO_SETTING_KEYS = {
  metaTitle: "seo.metaTitle",
  metaDescription: "seo.metaDescription",
  keywords: "seo.keywords",
  googleAnalyticsId: "seo.googleAnalyticsId",
  googleSearchConsoleCode: "seo.googleSearchConsoleCode",
  ogImageUrl: "seo.ogImageUrl",
} as const;

export const FREEMIUM_SETTING_KEYS = {
  guestPreviewLimit: "freemium.guestPreviewLimit",
  guestPreviewWindowHours: "freemium.guestPreviewWindowHours",
} as const;

export const BRANDING_DEFAULTS = {
  siteName: "Astro Tharaka",
  description:
    "Find your destiny with Astro Tharaka (තාරකා). ඔබේ ඉරණම සොයන්න — birth charts, horoscopes and guidance for Sri Lanka.",
  slogan: "ඔබේ ඉරණම සොයන්න — Find your destiny",
  logoUrl: "/brand/taraka-mark.png",
  faviconUrl: "/favicon.png",
  h1Text: "Astro Tharaka (තාරකා)",
  colorPrimary: "#0B0F19",
  colorSecondary: "#13213a",
  colorAccent: "#d4af37",
  buttonStyle: "rounded",
  defaultLanguage: "en",
} as const;

export const SEO_DEFAULTS = {
  metaTitle:
    "Astro Tharaka (තාරකා) — Find Your Destiny | ඔබේ ඉරණම සොයන්න",
  metaDescription:
    "Find your destiny with Astro Tharaka (තාරකා). AI birth charts, horoscopes, porondam and baby names for Sri Lanka. ඔබේ ඉරණම, කේන්දරය, නැකැත් සහ ජ්‍යෝතිෂ්‍ය මග පෙන්වීම — online astrology guidance.",
  keywords:
    "Astro Tharaka, Taraka, තාරකා, astrotharaka, find your destiny, iranama, ඉරණම, ඔබේ ඉරණම, ජ්‍යෝතිෂ්‍ය, කේන්දරය, නැකැත්, ජාතකය, පොරොන්දම්, horoscope Sri Lanka, birth chart Sri Lanka, Sinhala astrology, porondam, baby names Sri Lanka, ළදරු නම්, online astrology, Vedic astrology Lanka",
  googleAnalyticsId: "",
  googleSearchConsoleCode: "",
  ogImageUrl: "/brand/taraka-mark.png",
} as const;

/** Guest free previews: N uses per browser session key within a rolling window. */
export const FREEMIUM_DEFAULTS = {
  guestPreviewLimit: 2,
  guestPreviewWindowHours: 24,
} as const;

export type BrandingSettings = {
  siteName: string;
  description: string;
  slogan: string;
  logoUrl: string;
  faviconUrl: string;
  h1Text: string;
  colorPrimary: string;
  colorSecondary: string;
  colorAccent: string;
  buttonStyle: string;
  defaultLanguage: string;
};

export type SeoSettings = {
  metaTitle: string;
  metaDescription: string;
  keywords: string;
  googleAnalyticsId: string;
  googleSearchConsoleCode: string;
  ogImageUrl: string;
};

export type FreemiumSettings = {
  /** How many free guest previews allowed per guest session key. */
  guestPreviewLimit: number;
  /** Rolling window (hours) before the guest usage counter resets. */
  guestPreviewWindowHours: number;
};
