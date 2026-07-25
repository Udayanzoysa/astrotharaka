"use client";

import { ContentPage } from "@/components/layout/content-page";
import { FaqAccordion } from "@/components/layout/faq-accordion";
import { useUi } from "@/components/providers/ui-provider";

export default function FaqPage() {
  const { t } = useUi();

  const items = [
    { question: t("faqQ1"), answer: t("faqA1") },
    { question: t("faqQ2"), answer: t("faqA2") },
    { question: t("faqQ3"), answer: t("faqA3") },
    { question: t("faqQ4"), answer: t("faqA4") },
  ];

  return (
    <ContentPage eyebrow={t("faqEyebrow")} title={t("faqTitle")} lead={t("faqLead")}>
      <FaqAccordion items={items} />
    </ContentPage>
  );
}
