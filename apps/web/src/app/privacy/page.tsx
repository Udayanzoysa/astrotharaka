"use client";

import {
  ContentHeading,
  ContentList,
  ContentPage,
  ContentParagraph,
} from "@/components/layout/content-page";
import { useUi } from "@/components/providers/ui-provider";

export default function PrivacyPage() {
  const { t } = useUi();

  return (
    <ContentPage eyebrow={t("legalEyebrow")} title={t("privacyTitle")} lead={t("privacyLead")}>
      <ContentParagraph>{t("privacyUpdated")}</ContentParagraph>
      <ContentHeading>{t("privacyS1Title")}</ContentHeading>
      <ContentParagraph>{t("privacyS1Body")}</ContentParagraph>
      <ContentHeading>{t("privacyS2Title")}</ContentHeading>
      <ContentList items={[t("privacyS2P1"), t("privacyS2P2"), t("privacyS2P3"), t("privacyS2P4")]} />
      <ContentHeading>{t("privacyS3Title")}</ContentHeading>
      <ContentParagraph>{t("privacyS3Body")}</ContentParagraph>
      <ContentHeading>{t("privacyS4Title")}</ContentHeading>
      <ContentParagraph>{t("privacyS4Body")}</ContentParagraph>
      <ContentHeading>{t("privacyS5Title")}</ContentHeading>
      <ContentParagraph>{t("privacyS5Body")}</ContentParagraph>
    </ContentPage>
  );
}
