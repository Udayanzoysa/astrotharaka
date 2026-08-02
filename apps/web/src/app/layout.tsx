import type { Metadata } from "next";
import { headers } from "next/headers";
import Script from "next/script";
import {
  Abhaya_Libre,
  Cinzel,
  Noto_Sans_Sinhala,
  Noto_Serif_Sinhala,
  Poppins,
} from "next/font/google";
import { AuthProvider } from "@/components/providers/auth-provider";
import { UiProvider } from "@/components/providers/ui-provider";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteThemeApplier } from "@/components/layout/site-theme-applier";
import {
  DEFAULT_KEYWORDS,
  DEFAULT_META_DESCRIPTION,
  DEFAULT_META_TITLE,
  DEFAULT_OG_IMAGE,
  DEFAULT_SITE_URL,
} from "@/lib/seo-defaults";
import "./globals.css";

/** Required so per-request CSP nonces from middleware are applied to scripts. */
export const dynamic = "force-dynamic";

const cinzel = Cinzel({
  variable: "--font-cinzel",
  subsets: ["latin"],
  weight: ["600", "700"],
  display: "optional",
  preload: false,
});

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

const notoSinhala = Noto_Sans_Sinhala({
  variable: "--font-noto-sinhala",
  subsets: ["sinhala"],
  weight: ["400", "600"],
  display: "swap",
  adjustFontFallback: true,
});

/** Display Sinhala — optional so late swap does not inflate CLS. */
const abhayaLibre = Abhaya_Libre({
  variable: "--font-abhaya",
  subsets: ["sinhala", "latin"],
  weight: ["600", "700"],
  display: "optional",
  preload: false,
  adjustFontFallback: true,
});

const notoSerifSinhala = Noto_Serif_Sinhala({
  variable: "--font-noto-serif-sinhala",
  subsets: ["sinhala"],
  weight: ["400", "600"],
  display: "optional",
  preload: false,
  adjustFontFallback: true,
});

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000/api/v1";

type PublicSiteSettings = {
  branding: {
    siteName: string;
    description: string;
    faviconUrl: string;
  };
  seo: {
    metaTitle: string;
    metaDescription: string;
    keywords: string;
    googleAnalyticsId: string;
    googleSearchConsoleCode: string;
    ogImageUrl: string;
  };
};

async function loadPublicSettings(): Promise<PublicSiteSettings | null> {
  try {
    const res = await fetch(`${API_URL}/site-settings/public`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return null;
    return (await res.json()) as PublicSiteSettings;
  } catch {
    return null;
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const settings = await loadPublicSettings();
  const title = settings?.seo.metaTitle?.trim() || DEFAULT_META_TITLE;
  const description = settings?.seo.metaDescription?.trim() || DEFAULT_META_DESCRIPTION;
  const keywords = settings?.seo.keywords?.trim()
    ? settings.seo.keywords.split(",").map((k) => k.trim()).filter(Boolean)
    : DEFAULT_KEYWORDS;
  const ogImage = settings?.seo.ogImageUrl?.trim() || DEFAULT_OG_IMAGE;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim() || DEFAULT_SITE_URL;

  return {
    metadataBase: new URL(siteUrl),
    title: {
      default: title,
      template: `%s | Astro Tharaka (තාරකා)`,
    },
    description,
    keywords,
    applicationName: "Astro Tharaka",
    authors: [{ name: "Astro Tharaka" }],
    creator: "Astro Tharaka",
    publisher: "Astro Tharaka",
    category: "astrology",
    icons: {
      icon: [
        { url: "/favicon.ico", sizes: "any" },
        { url: "/favicon-32.png", type: "image/png", sizes: "32x32" },
        { url: "/favicon.png", type: "image/png", sizes: "512x512" },
      ],
      apple: [{ url: "/apple-icon.png", type: "image/png", sizes: "180x180" }],
      shortcut: "/favicon.ico",
    },
    openGraph: {
      type: "website",
      locale: "en_LK",
      alternateLocale: ["si_LK", "ta_LK"],
      url: siteUrl,
      siteName: "Astro Tharaka (තාරකා)",
      title,
      description,
      images: [
        {
          url: ogImage,
          width: 512,
          height: 512,
          alt: "Astro Tharaka — Find your destiny | ඔබේ ඉරණම සොයන්න",
        },
      ],
    },
    twitter: {
      card: "summary",
      title,
      description,
      images: [ogImage],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: { index: true, follow: true },
    },
    alternates: {
      canonical: siteUrl,
      languages: {
        "en-LK": siteUrl,
        "si-LK": siteUrl,
      },
    },
    verification: settings?.seo.googleSearchConsoleCode
      ? { google: settings.seo.googleSearchConsoleCode }
      : undefined,
    other: settings?.seo.googleAnalyticsId
      ? { "google-analytics": settings.seo.googleAnalyticsId }
      : undefined,
  };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const nonce = (await headers()).get("x-nonce") ?? undefined;
  const settings = await loadPublicSettings();
  const gaId = settings?.seo.googleAnalyticsId?.trim();

  return (
    <html lang="en-LK" data-theme="dark" suppressHydrationWarning>
      <body
        className={`${cinzel.variable} ${poppins.variable} ${notoSinhala.variable} ${abhayaLibre.variable} ${notoSerifSinhala.variable} antialiased`}
      >
        {gaId ? (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
              strategy="afterInteractive"
              nonce={nonce}
            />
            <Script id="ga-init" strategy="afterInteractive" nonce={nonce}>
              {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js', new Date());gtag('config', '${gaId}');`}
            </Script>
          </>
        ) : null}
        <UiProvider>
          <AuthProvider>
            <SiteThemeApplier />
            <div className="flex min-h-dvh flex-col">
              <SiteHeader />
              <main className="flex-1">{children}</main>
              <SiteFooter />
            </div>
          </AuthProvider>
        </UiProvider>
      </body>
    </html>
  );
}
