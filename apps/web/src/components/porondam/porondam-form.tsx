"use client";

import { FormEvent, useEffect, useState } from "react";
import { ApiError, apiRequest } from "@/lib/api";
import { readBirthDraft, writeBirthDraft } from "@/lib/birth-draft";
import { canGuestUse, consumeGuestUse } from "@/lib/guest-usage";
import { useAuth } from "@/components/providers/auth-provider";
import { useUi } from "@/components/providers/ui-provider";
import { usePreviewConsumed } from "@/hooks/use-preview-consumed";
import { PackageUpgradeGate } from "@/components/subscription/package-upgrade-gate";
import { SubscriptionQuotaBanner } from "@/components/subscription/subscription-quota-banner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field } from "@/components/ui/field";

type PersonAnchors = {
  fullName: string;
  birthPlaceName: string;
  lagna: { signSi: string; signEn: string; degree: number };
  moonRashi: { signSi: string; signEn: string; degree: number };
  nakshatra: { nameSi: string; nameEn: string; pada: number };
  mars: { signSi: string; house: number };
};

type PorondamDetail = { name: string; status: string; description: string };

type PorondamResult = {
  token: string;
  groomName: string;
  brideName: string;
  compatibilityScore: string | null;
  anchors: { groom?: PersonAnchors; bride?: PersonAnchors };
  report: {
    compatibility_score: string;
    porondam_details: PorondamDetail[];
    dosha_analysis: string;
    summary_si: string;
  } | null;
  aiModel: string | null;
};

function AnchorCard({
  title,
  person,
}: {
  title: string;
  person?: PersonAnchors;
}) {
  if (!person) return null;
  return (
    <Card>
      <h3 className="font-heading text-accent">{title}</h3>
      <p className="mt-1 text-sm text-ink">{person.fullName}</p>
      <p className="text-xs text-muted">{person.birthPlaceName}</p>
      <dl className="mt-3 space-y-1.5 text-sm text-muted">
        <div>
          <span className="text-ink">නැකත:</span> {person.nakshatra.nameSi} (
          {person.nakshatra.nameEn}) · පාද {person.nakshatra.pada}
        </div>
        <div>
          <span className="text-ink">චන්ද්‍ර රාශි:</span> {person.moonRashi.signSi} (
          {person.moonRashi.signEn}) {person.moonRashi.degree.toFixed(1)}°
        </div>
        <div>
          <span className="text-ink">ලග්නය:</span> {person.lagna.signSi} ({person.lagna.signEn}){" "}
          {person.lagna.degree.toFixed(1)}°
        </div>
        <div>
          <span className="text-ink">කුජ:</span> {person.mars.signSi} · ගෘහ {person.mars.house}
        </div>
      </dl>
    </Card>
  );
}

export function PorondamForm() {
  const { t } = useUi();
  const { user, token } = useAuth();
  const previewConsumed = usePreviewConsumed();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<PorondamResult | null>(null);
  const [showPackages, setShowPackages] = useState(false);
  const [gateStep, setGateStep] = useState<"packages" | "account">("packages");
  const [prefill, setPrefill] = useState({
    groomName: "",
    groomBirthDate: "",
    groomBirthTime: "",
    groomBirthPlace: "",
  });

  useEffect(() => {
    const draft = readBirthDraft();
    setPrefill({
      groomName: user?.profile?.fullName || draft?.fullName || "",
      groomBirthDate: user?.profile?.birthDate || draft?.birthDate || "",
      groomBirthTime: user?.profile?.birthTime || draft?.birthTime || "",
      groomBirthPlace: user?.profile?.birthPlaceName || draft?.birthPlaceName || "",
    });
  }, [user]);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const form = new FormData(e.currentTarget);

    writeBirthDraft({
      fullName: String(form.get("groomName") ?? "") || undefined,
      email: user?.email || readBirthDraft()?.email,
      birthDate: String(form.get("groomBirthDate") ?? "") || undefined,
      birthTime: String(form.get("groomBirthTime") ?? "") || undefined,
      birthPlaceName: String(form.get("groomBirthPlace") ?? "") || undefined,
      source: user ? "profile" : "guest",
    });

    if (!token && !canGuestUse("porondam")) {
      setGateStep("packages");
      setShowPackages(true);
      return;
    }

    setLoading(true);
    setResult(null);
    try {
      const data = await apiRequest<PorondamResult & { accessMode?: string }>("/porondam", {
        token: token || undefined,
        body: {
          groomName: String(form.get("groomName") ?? ""),
          groomBirthDate: String(form.get("groomBirthDate") ?? ""),
          groomBirthTime: String(form.get("groomBirthTime") ?? ""),
          groomBirthPlace: String(form.get("groomBirthPlace") ?? ""),
          brideName: String(form.get("brideName") ?? ""),
          brideBirthDate: String(form.get("brideBirthDate") ?? ""),
          brideBirthTime: String(form.get("brideBirthTime") ?? ""),
          brideBirthPlace: String(form.get("brideBirthPlace") ?? ""),
        },
      });
      if (data.accessMode === "FREE_PREVIEW") consumeGuestUse("porondam");
      setResult(data);
    } catch (err) {
      if (err instanceof ApiError && (err.code === "LOGIN_REQUIRED" || err.code === "FREE_PREVIEW_USED")) {
        setGateStep("packages");
        setShowPackages(true);
      } else if (
        err instanceof ApiError &&
        (err.code === "QUOTA_EXCEEDED" || err.code === "SUBSCRIPTION_REQUIRED")
      ) {
        setGateStep("packages");
        setShowPackages(true);
        setError(
          err.code === "QUOTA_EXCEEDED"
            ? t("subscriptionQuotaExceeded")
            : t("subscriptionRequired"),
        );
      } else {
        setError(err instanceof ApiError ? err.message : t("porondamError"));
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <Card className="fade-up">
        <h1 className="font-heading text-2xl text-ink md:text-3xl">{t("porondamTitle")}</h1>
        <p className="mt-2 text-sm text-muted">{t("porondamHint")}</p>
        <div className="mt-4">
          <SubscriptionQuotaBanner service="porondam" />
        </div>

        <form
          className="mt-6 space-y-6"
          onSubmit={onSubmit}
          key={`${prefill.groomBirthDate}-${prefill.groomBirthPlace}`}
        >
          <section className="space-y-3">
            <h2 className="font-heading text-lg text-accent">{t("porondamGroom")}</h2>
            <Field
              label={t("fullName")}
              name="groomName"
              required
              minLength={2}
              defaultValue={prefill.groomName}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label={t("birthDate")}
                name="groomBirthDate"
                type="date"
                required
                defaultValue={prefill.groomBirthDate}
              />
              <Field
                label={t("birthTime")}
                name="groomBirthTime"
                type="time"
                required
                defaultValue={prefill.groomBirthTime}
              />
            </div>
            <Field
              label={t("birthPlace")}
              name="groomBirthPlace"
              required
              minLength={2}
              placeholder="Colombo, Kandy…"
              defaultValue={prefill.groomBirthPlace}
            />
          </section>

          <section className="space-y-3 border-t border-line pt-5">
            <h2 className="font-heading text-lg text-accent">{t("porondamBride")}</h2>
            <Field label={t("fullName")} name="brideName" required minLength={2} />
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={t("birthDate")} name="brideBirthDate" type="date" required />
              <Field label={t("birthTime")} name="brideBirthTime" type="time" required />
            </div>
            <Field
              label={t("birthPlace")}
              name="brideBirthPlace"
              required
              minLength={2}
              placeholder="Galle, Matara…"
            />
          </section>

          {error ? <p className="text-sm text-[var(--danger)]">{error}</p> : null}

          <Button type="submit" fullWidth disabled={loading}>
            {loading ? t("porondamGenerating") : t("porondamGenerate")}
          </Button>
          <p className="text-center text-xs text-muted">
            {previewConsumed ? t("hadahanaHint") : t("guestFreeOnceHint")}
          </p>
        </form>
      </Card>

      {loading ? (
        <Card>
          <p className="font-heading text-accent">{t("porondamGenerating")}</p>
          <p className="mt-2 text-sm text-muted">{t("porondamGeneratingHint")}</p>
        </Card>
      ) : null}

      {result?.report ? (
        <div className="space-y-4">
          <Card>
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="font-heading text-xl text-ink">{t("porondamResults")}</h2>
                <p className="mt-1 text-sm text-muted">
                  {result.groomName} × {result.brideName}
                </p>
              </div>
              <div className="rounded-xl border border-accent/40 bg-[color-mix(in_srgb,var(--accent)_12%,transparent)] px-4 py-2 text-center">
                <p className="text-xs uppercase tracking-wide text-muted">{t("porondamScore")}</p>
                <p className="font-heading text-2xl text-accent">
                  {result.report.compatibility_score || result.compatibilityScore}
                </p>
              </div>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-ink" lang="si">
              {result.report.summary_si}
            </p>
          </Card>

          <div className="grid gap-4 md:grid-cols-2">
            <AnchorCard title={t("porondamGroom")} person={result.anchors.groom} />
            <AnchorCard title={t("porondamBride")} person={result.anchors.bride} />
          </div>

          <Card>
            <h3 className="font-heading text-accent">{t("porondamTable")}</h3>
            <div className="mt-4 overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="border-b border-line text-xs uppercase tracking-wide text-muted">
                  <tr>
                    <th className="px-2 py-2">{t("porondamColName")}</th>
                    <th className="px-2 py-2">{t("porondamColStatus")}</th>
                    <th className="px-2 py-2">{t("porondamColDesc")}</th>
                  </tr>
                </thead>
                <tbody>
                  {result.report.porondam_details.map((row) => (
                    <tr key={row.name} className="border-b border-line/60 align-top">
                      <td className="px-2 py-3 font-medium text-ink" lang="si">
                        {row.name}
                      </td>
                      <td className="px-2 py-3 text-accent" lang="si">
                        {row.status}
                      </td>
                      <td className="px-2 py-3 text-muted" lang="si">
                        {row.description}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <Card>
            <h3 className="font-heading text-accent">{t("porondamDosha")}</h3>
            <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-muted" lang="si">
              {result.report.dosha_analysis}
            </p>
          </Card>
        </div>
      ) : null}

      <PackageUpgradeGate
        open={showPackages}
        onClose={() => setShowPackages(false)}
        serviceLabel={t("quotaPorondam")}
        returnTo="/porondam"
        initialStep={gateStep}
      />
    </div>
  );
}
