"use client";

import Link from "next/link";
import {
  ContentHeading,
  ContentList,
  ContentPage,
  ContentParagraph,
} from "@/components/layout/content-page";
import { useUi } from "@/components/providers/ui-provider";

export default function RefundPage() {
  const { t } = useUi();

  return (
    <ContentPage eyebrow={t("legalEyebrow")} title={t("refundTitle")} lead={t("refundLead")}>
      <div className="rounded-xl border border-[color-mix(in_srgb,#e8c96a_40%,transparent)] bg-[color-mix(in_srgb,#e8c96a_8%,transparent)] px-5 py-4">
        <p className="text-sm font-medium leading-relaxed text-ink sm:text-[15px]">{t("refundHighlight")}</p>
      </div>
      <ContentHeading>{t("refundS1Title")}</ContentHeading>
      <ContentParagraph>{t("refundS1Body")}</ContentParagraph>
      <ContentHeading>{t("refundS2Title")}</ContentHeading>
      <ContentList items={[t("refundS2P1"), t("refundS2P2"), t("refundS2P3")]} />
      <ContentHeading>{t("refundS3Title")}</ContentHeading>
      <ContentParagraph>{t("refundS3Body")}</ContentParagraph>
      <ContentParagraph>
        <Link href="/contact" className="text-ink underline-offset-4 hover:text-accent hover:underline">
          {t("footerContact")}
        </Link>
        {" · "}
        <Link href="/terms" className="text-ink underline-offset-4 hover:text-accent hover:underline">
          {t("footerTerms")}
        </Link>
      </ContentParagraph>
    </ContentPage>
  );
}
