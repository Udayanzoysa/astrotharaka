"use client";

import {
  ContentHeading,
  ContentList,
  ContentPage,
  ContentParagraph,
} from "@/components/layout/content-page";
import { useUi } from "@/components/providers/ui-provider";

export default function TermsPage() {
  const { t } = useUi();

  return (
    <ContentPage eyebrow={t("legalEyebrow")} title={t("termsTitle")} lead={t("termsLead")}>
      <ContentParagraph>{t("termsUpdated")}</ContentParagraph>
      <ContentHeading>{t("termsS1Title")}</ContentHeading>
      <ContentParagraph>{t("termsS1Body")}</ContentParagraph>
      <ContentHeading>{t("termsS2Title")}</ContentHeading>
      <ContentParagraph>{t("termsS2Body")}</ContentParagraph>
      <ContentHeading>{t("termsS3Title")}</ContentHeading>
      <ContentList items={[t("termsS3P1"), t("termsS3P2"), t("termsS3P3")]} />
      <ContentHeading>{t("termsS4Title")}</ContentHeading>
      <ContentParagraph>{t("termsS4Body")}</ContentParagraph>
      <ContentHeading>{t("termsS5Title")}</ContentHeading>
      <ContentParagraph>{t("termsS5Body")}</ContentParagraph>
    </ContentPage>
  );
}
