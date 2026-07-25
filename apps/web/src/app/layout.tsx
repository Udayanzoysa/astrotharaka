import type { Metadata } from "next";
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
import "./globals.css";

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
  const title = settings?.seo.metaTitle || "Taraka (තාරකා) — AstroAI Lanka";
  const description =
    settings?.seo.metaDescription || "Navigating a destiny through the air mass.";
  const keywords = settings?.seo.keywords
    ? settings.seo.keywords.split(",").map((k) => k.trim()).filter(Boolean)
    : undefined;
  const ogImage = settings?.seo.ogImageUrl || "/brand/taraka-mark.png";
  const favicon = settings?.branding.faviconUrl || "/favicon.ico";

  return {
    title,
    description,
    keywords,
    icons: { icon: favicon },
    openGraph: {
      title,
      description,
      images: [{ url: ogImage }],
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
  const settings = await loadPublicSettings();
  const gaId = settings?.seo.googleAnalyticsId?.trim();

  return (
    <html lang="en" data-theme="dark" suppressHydrationWarning>
      <body
        className={`${cinzel.variable} ${poppins.variable} ${notoSinhala.variable} ${abhayaLibre.variable} ${notoSerifSinhala.variable} antialiased`}
      >
        {gaId ? (
          <>
            <script async src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`} />
            <script
              dangerouslySetInnerHTML={{
                __html: `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js', new Date());gtag('config', '${gaId}');`,
              }}
            />
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
