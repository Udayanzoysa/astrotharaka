"use client";

import Link from "next/link";
import { useId } from "react";
import { FaqAccordion } from "@/components/layout/faq-accordion";
import { useUi } from "@/components/providers/ui-provider";

export function HomeFaqSection() {
  const { t, language } = useUi();
  const isSi = language === "si";
  const baseId = useId();

  const items = [
    { question: t("faqQ1"), answer: t("faqA1") },
    { question: t("faqQ2"), answer: t("faqA2") },
    { question: t("faqQ3"), answer: t("faqA3") },
    { question: t("faqQ4"), answer: t("faqA4") },
  ];

  return (
    <section
      id="faq"
      className="home-section relative border-t border-line/60 bg-[color-mix(in_srgb,var(--bg-card)_28%,transparent)]"
      aria-labelledby={`${baseId}-heading`}
    >
      <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6 sm:py-16 md:py-20">
        <p className="home-section__eyebrow text-center text-accent">{t("faqEyebrow")}</p>
        <h2
          id={`${baseId}-heading`}
          className={`mx-auto mt-3 max-w-2xl text-center text-ink ${
            isSi ? "font-sinhala-luxury" : "font-display"
          } home-section__title`}
        >
          {t("faqTitle")}
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-center text-sm text-muted sm:text-base">
          {t("faqLead")}
        </p>
        <div className="mt-10">
          <FaqAccordion items={items} />
        </div>
        <p className="mt-8 text-center text-sm text-muted">
          <Link href="/faq" className="text-ink underline-offset-4 hover:text-accent hover:underline">
            {t("footerFaq")}
          </Link>
          {" · "}
          <Link href="/contact" className="text-ink underline-offset-4 hover:text-accent hover:underline">
            {t("footerContact")}
          </Link>
        </p>
      </div>
    </section>
  );
}
