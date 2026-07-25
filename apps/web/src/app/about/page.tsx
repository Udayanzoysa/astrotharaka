"use client";

import Link from "next/link";
import {
  ContentHeading,
  ContentList,
  ContentPage,
  ContentParagraph,
} from "@/components/layout/content-page";
import { useUi } from "@/components/providers/ui-provider";

export default function AboutPage() {
  const { t } = useUi();

  return (
    <ContentPage eyebrow={t("aboutPageEyebrow")} title={t("aboutPageTitle")} lead={t("aboutPageLead")}>
      <ContentParagraph>{t("aboutPageBody1")}</ContentParagraph>
      <ContentParagraph>{t("aboutPageBody2")}</ContentParagraph>
      <ContentHeading>{t("aboutPageMissionTitle")}</ContentHeading>
      <ContentList
        items={[t("aboutPagePoint1"), t("aboutPagePoint2"), t("aboutPagePoint3"), t("aboutPagePoint4")]}
      />
      <ContentParagraph>
        <Link href="/contact" className="text-ink underline-offset-4 hover:text-accent hover:underline">
          {t("footerContact")}
        </Link>
        {" · "}
        <Link href="/faq" className="text-ink underline-offset-4 hover:text-accent hover:underline">
          {t("footerFaq")}
        </Link>
      </ContentParagraph>
    </ContentPage>
  );
}
