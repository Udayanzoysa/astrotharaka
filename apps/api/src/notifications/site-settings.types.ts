export const BRANDING_SETTING_KEYS = {
  siteName: 'branding.siteName',
  description: 'branding.description',
  slogan: 'branding.slogan',
  logoUrl: 'branding.logoUrl',
  faviconUrl: 'branding.faviconUrl',
  h1Text: 'branding.h1Text',
  colorPrimary: 'branding.colorPrimary',
  colorSecondary: 'branding.colorSecondary',
  colorAccent: 'branding.colorAccent',
  buttonStyle: 'branding.buttonStyle',
  defaultLanguage: 'branding.defaultLanguage',
} as const;

export const SEO_SETTING_KEYS = {
  metaTitle: 'seo.metaTitle',
  metaDescription: 'seo.metaDescription',
  keywords: 'seo.keywords',
  googleAnalyticsId: 'seo.googleAnalyticsId',
  googleSearchConsoleCode: 'seo.googleSearchConsoleCode',
  ogImageUrl: 'seo.ogImageUrl',
} as const;

export const BRANDING_DEFAULTS = {
  siteName: 'Taraka',
  description: 'Navigating a destiny through the air mass.',
  slogan: 'තාරකා ජ්‍යෝතිෂ්‍ය සේවය',
  logoUrl: '/brand/taraka-mark.png',
  faviconUrl: '/favicon.ico',
  h1Text: 'Taraka (තාරකා)',
  colorPrimary: '#0B0F19',
  colorSecondary: '#13213a',
  colorAccent: '#d4af37',
  buttonStyle: 'rounded',
  defaultLanguage: 'en',
} as const;

export const SEO_DEFAULTS = {
  metaTitle: 'Taraka (තාරකා) — AstroAI Lanka',
  metaDescription: 'Navigating a destiny through the air mass.',
  keywords: 'astrology, horoscope, sri lanka, taraka',
  googleAnalyticsId: '',
  googleSearchConsoleCode: '',
  ogImageUrl: '/brand/taraka-mark.png',
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
