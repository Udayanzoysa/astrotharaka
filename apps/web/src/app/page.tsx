"use client";

import Image from "next/image";
import { Starfield } from "@/components/landing/starfield";
import { GuestInstantReport } from "@/components/landing/guest-instant-report";
import { HomeOfferSection } from "@/components/landing/home-offer-section";
import {
  HomeAboutSection,
  HomeWhatWeOfferSection,
  HomeReportIncludesSection,
} from "@/components/landing/home-content-sections";
import { HomeFaqSection } from "@/components/landing/home-faq-section";
import { useUi } from "@/components/providers/ui-provider";
import { usePreviewConsumed } from "@/hooks/use-preview-consumed";

export default function LandingPage() {
  const { t, language } = useUi();
  const isSi = language === "si";
  const previewConsumed = usePreviewConsumed();

  return (
    <div className="home-page">
      <section className="home-hero relative flex min-h-[calc(100dvh-3.75rem)] flex-col sm:min-h-[calc(100dvh-4.25rem)]">
        <Starfield />
        <div className="relative z-10 mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center px-3 py-4 sm:max-w-3xl sm:px-5 sm:py-5 md:max-w-4xl md:px-8 lg:max-w-5xl">
          <div className="home-hero__intro flex w-full flex-col items-center text-center">
            <Image
              src="/brand/taraka-nav-clear.png"
              alt="Taraka"
              width={96}
              height={96}
              sizes="(max-width: 640px) 56px, (max-width: 768px) 64px, 96px"
              quality={70}
              className="home-hero__logo h-14 w-14 object-contain bg-transparent sm:h-16 sm:w-16 md:h-20 md:w-20 lg:h-24 lg:w-24"
              priority
              fetchPriority="high"
            />
            <p className="mt-1.5 font-heading text-[10px] uppercase tracking-[0.28em] text-accent sm:mt-2 sm:text-xs">
              Tharaka · තාරකා
            </p>
            <h1
              className={`home-hero__title mt-1.5 max-w-4xl text-ink sm:mt-2 ${
                isSi ? "font-sinhala-luxury" : "font-display"
              }`}
            >
              {isSi ? t("sloganSi") : t("slogan")}
            </h1>
          </div>

          <div id="home-report" className="mt-3 w-full scroll-mt-24 sm:mt-4 md:mt-5">
            <div className="home-form-card rounded-2xl border border-line bg-[color-mix(in_srgb,var(--bg)_84%,transparent)] p-3 backdrop-blur-md sm:rounded-3xl sm:p-4 md:p-5 lg:p-6">
              <div className="mb-3 min-h-[4.25rem] border-b border-line/70 pb-2.5 text-center sm:mb-4 sm:min-h-[4.75rem] sm:pb-3">
                <h2
                  className={`text-base leading-tight text-ink sm:text-lg md:text-xl ${
                    isSi ? "font-sinhala-luxury" : "font-heading"
                  }`}
                >
                  {previewConsumed ? t("hadahanaTitle") : t("guestReportTitle")}
                </h2>
                <p
                  className={`mt-0.5 text-xs leading-snug text-muted sm:text-sm ${
                    isSi ? "font-sinhala-luxury" : ""
                  }`}
                >
                  {previewConsumed ? t("hadahanaFormLead") : t("guestFormLead")}
                </p>
              </div>
              <GuestInstantReport />
            </div>
          </div>

          <p className="mt-3 shrink-0 px-2 text-center text-[10px] text-muted sm:mt-4 sm:text-[11px] md:text-xs">
            {t("disclaimer")}
          </p>
        </div>
      </section>

      <HomeOfferSection />
      <HomeAboutSection />
      <HomeWhatWeOfferSection />
      <HomeReportIncludesSection />
      <HomeFaqSection />
    </div>
  );
}
