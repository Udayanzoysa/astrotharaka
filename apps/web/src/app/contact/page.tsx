"use client";

import Link from "next/link";
import {
  ContentHeading,
  ContentPage,
  ContentParagraph,
} from "@/components/layout/content-page";
import { useUi } from "@/components/providers/ui-provider";

export default function ContactPage() {
  const { t, language } = useUi();
  const isSi = language === "si";
  const email = t("contactEmailValue");

  return (
    <ContentPage
      eyebrow={t("contactPageEyebrow")}
      title={t("contactPageTitle")}
      lead={t("contactPageLead")}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <a
          href={`mailto:${email}`}
          className="block rounded-xl border border-line/80 bg-[color-mix(in_srgb,var(--bg)_50%,transparent)] px-5 py-5 transition hover:border-[color-mix(in_srgb,#e8c96a_45%,transparent)]"
        >
          <p className="home-section__eyebrow text-accent">{t("contactEmailLabel")}</p>
          <p className={`mt-2 text-base text-ink ${isSi ? "font-sinhala-luxury" : "font-heading"}`}>
            {email}
          </p>
          <p className="mt-2 text-sm text-muted">{t("contactEmailHint")}</p>
        </a>
        <div className="rounded-xl border border-line/80 bg-[color-mix(in_srgb,var(--bg)_50%,transparent)] px-5 py-5">
          <p className="home-section__eyebrow text-accent">{t("contactHoursLabel")}</p>
          <p className={`mt-2 text-base text-ink ${isSi ? "font-sinhala-luxury" : "font-heading"}`}>
            {t("contactHoursValue")}
          </p>
          <p className="mt-2 text-sm text-muted">{t("contactHoursHint")}</p>
        </div>
      </div>

      <ContentHeading>{t("contactHelpTitle")}</ContentHeading>
      <ContentParagraph>{t("contactHelpBody")}</ContentParagraph>
      <ContentParagraph>
        <Link href="/faq" className="text-ink underline-offset-4 hover:text-accent hover:underline">
          {t("footerFaq")}
        </Link>
        {" · "}
        <Link href="/subscription" className="text-ink underline-offset-4 hover:text-accent hover:underline">
          {t("subscription")}
        </Link>
        {" · "}
        <Link href="/refund" className="text-ink underline-offset-4 hover:text-accent hover:underline">
          {t("footerRefund")}
        </Link>
      </ContentParagraph>
    </ContentPage>
  );
}
