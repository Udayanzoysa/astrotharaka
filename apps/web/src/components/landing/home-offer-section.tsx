"use client";

import Image from "next/image";
import Link from "next/link";
import { useUi } from "@/components/providers/ui-provider";
import { usePreviewConsumed } from "@/hooks/use-preview-consumed";

const SUPPORT_PHONE = "0715375179";
const SUPPORT_WA = "94715375179";

export function HomeOfferSection() {
  const { t, language } = useUi();
  const isSi = language === "si";
  const previewConsumed = usePreviewConsumed();

  return (
    <section id="limited-offer" className="home-section home-offer relative overflow-hidden">
      <div className="absolute inset-0">
        <Image
          src="/brand/offer-cosmic-book.png"
          alt=""
          fill
          className="object-cover object-center opacity-70"
          sizes="(max-width: 768px) 100vw, 1200px"
          quality={55}
          loading="lazy"
          decoding="async"
        />
        <div className="home-offer__veil absolute inset-0" />
      </div>

      <div className="relative z-10 mx-auto max-w-5xl px-4 py-14 sm:px-6 sm:py-16 md:py-20">
        <p className="home-section__eyebrow text-center text-accent">{t("offerEyebrow")}</p>
        <h2
          className={`mx-auto mt-3 max-w-3xl text-center text-ink ${
            isSi ? "font-sinhala-luxury" : "font-display"
          } home-offer__title`}
        >
          {t("offerTitle")}
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-center text-sm text-muted sm:text-base">
          {t("offerLead")}
        </p>

        <div className="home-offer__price mx-auto mt-8 flex max-w-md flex-col items-center gap-1.5 rounded-2xl border border-[color-mix(in_srgb,#e8c96a_35%,var(--border))] bg-[color-mix(in_srgb,var(--bg)_78%,transparent)] px-6 py-5 text-center backdrop-blur-md">
          <span className="text-xs uppercase tracking-[0.2em] text-muted">{t("offerPriceLabel")}</span>
          <p className="font-display text-lg text-[var(--danger)] line-through decoration-2 sm:text-xl">
            1433 <span className="text-base sm:text-lg">LKR</span>
          </p>
          <p className="font-display text-4xl text-accent sm:text-5xl">
            500 <span className="text-2xl sm:text-3xl">LKR</span>
          </p>
          <p className="mt-0.5 text-xs font-medium text-[var(--danger)] sm:text-sm">{t("offerLimitedTime")}</p>
          <p className="text-xs text-muted sm:text-sm">{t("offerPriceHint")}</p>
        </div>

        <div className="mt-10 grid gap-8 sm:grid-cols-3">
          <div className="home-offer__block">
            <h3 className="font-heading text-sm uppercase tracking-[0.16em] text-accent">
              {t("offerDeliveryTitle")}
            </h3>
            <ul className="mt-3 space-y-2.5 text-sm text-ink/90">
              <li className="flex items-center gap-2.5">
                <OfferIcon kind="email" />
                {t("offerDeliveryEmail")}
              </li>
              <li className="flex items-center gap-2.5">
                <OfferIcon kind="whatsapp" />
                {t("offerDeliveryWhatsapp")}
              </li>
            </ul>
          </div>

          <div className="home-offer__block">
            <h3 className="font-heading text-sm uppercase tracking-[0.16em] text-accent">
              {t("offerPayTitle")}
            </h3>
            <ul className="mt-3 space-y-2.5 text-sm text-ink/90">
              <li className="flex items-center gap-2.5">
                <OfferIcon kind="secure" />
                {t("offerPaySecure")}
              </li>
              <li className="flex items-center gap-2.5">
                <OfferIcon kind="bank" />
                {t("offerPayBank")}
              </li>
            </ul>
          </div>

          <div className="home-offer__block">
            <h3 className="font-heading text-sm uppercase tracking-[0.16em] text-accent">
              {t("offerSupportTitle")}
            </h3>
            <ul className="mt-3 space-y-2.5 text-sm text-ink/90">
              <li className="flex items-center gap-2.5">
                <OfferIcon kind="phone" />
                <a href={`tel:+94${SUPPORT_PHONE.slice(1)}`} className="hover:text-accent">
                  {SUPPORT_PHONE}
                </a>
              </li>
              <li className="flex items-center gap-2.5">
                <OfferIcon kind="whatsapp" />
                <a
                  href={`https://wa.me/${SUPPORT_WA}`}
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-accent"
                >
                  WhatsApp
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
          <Link href="/shop" className="inline-flex">
            <span className="home-offer__cta inline-flex min-h-11 items-center rounded-xl bg-[var(--accent)] px-6 text-sm font-semibold text-[#0b0f19] shadow-[0_0_24px_rgba(232,201,106,0.28)] transition hover:brightness-105">
              {t("offerCta")}
            </span>
          </Link>
          <a href="#home-report" className="inline-flex">
            <span className="inline-flex min-h-11 items-center rounded-xl border border-line px-5 text-sm text-ink hover:border-accent">
              {previewConsumed ? t("offerTryHadahana") : t("offerTryFree")}
            </span>
          </a>
        </div>
      </div>
    </section>
  );
}

function OfferIcon({ kind }: { kind: "email" | "whatsapp" | "secure" | "bank" | "phone" }) {
  const common = "h-5 w-5 shrink-0 text-accent";
  switch (kind) {
    case "email":
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M4 6.5h16v11H4v-11Zm0 0 8 6 8-6"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "whatsapp":
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M12 3.5a8.2 8.2 0 0 0-7 12.5L4 20.5l4.7-1.2A8.2 8.2 0 1 0 12 3.5Z"
            stroke="currentColor"
            strokeWidth="1.6"
          />
          <path
            d="M9.2 9.4c.3-.5.6-.5.9-.5h.3c.2 0 .4 0 .5.4l.7 1.7c.1.2 0 .4-.1.6l-.4.5c-.1.1-.1.3 0 .4.4.7 1.1 1.4 1.9 1.8.2.1.3.1.4 0l.6-.5c.2-.1.4-.1.5 0l1.5.9c.3.2.4.3.3.6-.2.7-1.1 1.2-1.8 1.1-.9-.1-2.3-.6-3.8-2-1.4-1.3-2.2-2.8-2.4-3.8-.1-.6.2-1.4.7-1.8Z"
            fill="currentColor"
          />
        </svg>
      );
    case "secure":
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M12 3.5 5.5 6.2v5.1c0 4 2.7 6.9 6.5 8.2 3.8-1.3 6.5-4.2 6.5-8.2V6.2L12 3.5Z"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinejoin="round"
          />
          <path d="M9.5 12.1 11.2 13.8 14.8 10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      );
    case "bank":
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M4 10h16M6 10v7M10 10v7M14 10v7M18 10v7M3.5 17.5h17M12 4l8 4.5H4L12 4Z"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "phone":
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M8.2 4.8h2.1l1 4.2-1.6 1c.8 1.6 2.1 2.9 3.7 3.7l1-1.6 4.2 1v2.1c0 .6-.4 1.1-1 1.2-7.2 1.2-13.1-4.7-11.9-11.9.1-.6.6-1 1.2-1Z"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinejoin="round"
          />
        </svg>
      );
  }
}
