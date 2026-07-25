"use client";

import { useUi } from "@/components/providers/ui-provider";

export function HomeAboutSection() {
  const { t, language } = useUi();
  const isSi = language === "si";

  return (
    <section id="about" className="home-section relative border-t border-line/60">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 sm:py-16 md:grid-cols-2 md:items-center md:gap-14 md:py-20">
        <div>
          <p className="home-section__eyebrow text-accent">{t("aboutEyebrow")}</p>
          <h2
            className={`mt-3 text-ink ${isSi ? "font-sinhala-luxury" : "font-display"} home-section__title`}
          >
            {t("aboutTitle")}
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-muted sm:text-base">{t("aboutBody")}</p>
        </div>
        <div className="space-y-4">
          {[t("aboutPoint1"), t("aboutPoint2"), t("aboutPoint3")].map((line) => (
            <div
              key={line}
              className="flex gap-3 border-l-2 border-[color-mix(in_srgb,#e8c96a_55%,transparent)] pl-4"
            >
              <p className="text-sm leading-relaxed text-ink/90 sm:text-[15px]">{line}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function HomeWhatWeOfferSection() {
  const { t, language } = useUi();
  const isSi = language === "si";
  const items = [
    { title: t("offerItem1Title"), body: t("offerItem1Body") },
    { title: t("offerItem2Title"), body: t("offerItem2Body") },
    { title: t("offerItem3Title"), body: t("offerItem3Body") },
  ];

  return (
    <section id="what-we-offer" className="home-section relative border-t border-line/60 bg-[color-mix(in_srgb,var(--bg-card)_35%,transparent)]">
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-16 md:py-20">
        <p className="home-section__eyebrow text-center text-accent">{t("whatOfferEyebrow")}</p>
        <h2
          className={`mx-auto mt-3 max-w-2xl text-center text-ink ${
            isSi ? "font-sinhala-luxury" : "font-display"
          } home-section__title`}
        >
          {t("whatOfferTitle")}
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-center text-sm text-muted sm:text-base">
          {t("whatOfferLead")}
        </p>
        <div className="mt-10 grid gap-6 sm:grid-cols-3">
          {items.map((item) => (
            <article key={item.title} className="home-feature">
              <h3 className={`text-lg text-ink ${isSi ? "font-sinhala-luxury" : "font-heading"}`}>
                {item.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{item.body}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export function HomeReportIncludesSection() {
  const { t, language } = useUi();
  const isSi = language === "si";
  const items = [
    t("include1"),
    t("include2"),
    t("include3"),
    t("include4"),
    t("include5"),
    t("include6"),
    t("include7"),
    t("include8"),
  ];

  return (
    <section id="report-includes" className="home-section relative border-t border-line/60">
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-16 md:py-20">
        <p className="home-section__eyebrow text-center text-accent">{t("includesEyebrow")}</p>
        <h2
          className={`mx-auto mt-3 max-w-2xl text-center text-ink ${
            isSi ? "font-sinhala-luxury" : "font-display"
          } home-section__title`}
        >
          {t("includesTitle")}
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-center text-sm text-muted sm:text-base">
          {t("includesLead")}
        </p>
        <ul className="mx-auto mt-10 grid max-w-4xl gap-3 sm:grid-cols-2">
          {items.map((item, i) => (
            <li
              key={item}
              className="flex items-start gap-3 rounded-xl border border-line/80 bg-[color-mix(in_srgb,var(--bg)_55%,transparent)] px-4 py-3.5"
            >
              <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-[color-mix(in_srgb,#e8c96a_45%,transparent)] text-[11px] text-accent">
                {i + 1}
              </span>
              <span className="text-sm leading-snug text-ink/90">{item}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
