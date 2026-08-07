"use client";

import { FormEvent, useState } from "react";
import { ApiError, apiRequest } from "@/lib/api";
import { canGuestUse, consumeGuestUse, getGuestFreeLimit } from "@/lib/guest-usage";
import { useAuth } from "@/components/providers/auth-provider";
import { useUi } from "@/components/providers/ui-provider";
import { usePreviewConsumed } from "@/hooks/use-preview-consumed";
import { PackageUpgradeGate } from "@/components/subscription/package-upgrade-gate";
import { SubscriptionQuotaBanner } from "@/components/subscription/subscription-quota-banner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type DreamReport = {
  dream_summary: string;
  main_meaning: string;
  deep_analysis: string;
  category: string;
  actionable_advice: string;
  confidence_score: string;
};

type DreamResult = {
  token: string;
  dreamText: string;
  category: string | null;
  confidence: string | null;
  report: DreamReport | null;
  locked?: boolean;
  accessMode?: string;
};

function categoryTone(category: string | null | undefined): string {
  const s = (category || "").toLowerCase();
  if (s.includes("positive") || category?.includes("ධනාත්මක")) {
    return "border-[color-mix(in_srgb,#3d9a6a_45%,var(--border))] bg-[color-mix(in_srgb,#3d9a6a_12%,transparent)] text-[#2f7a54]";
  }
  if (s.includes("precaution") || category?.includes("සූදානම්")) {
    return "border-[color-mix(in_srgb,var(--accent)_45%,var(--border))] bg-[color-mix(in_srgb,var(--accent)_12%,transparent)] text-accent";
  }
  return "border-line bg-[var(--input-bg)] text-muted";
}

export function DreamInterpretationForm() {
  const { t } = useUi();
  const { token } = useAuth();
  const previewConsumed = usePreviewConsumed();
  const [dreamText, setDreamText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<DreamResult | null>(null);
  const [showPackages, setShowPackages] = useState(false);
  const [gateStep, setGateStep] = useState<"packages" | "account">("packages");

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const text = dreamText.trim();
    if (text.length < 8) {
      setError(t("dreamMinLength"));
      return;
    }

    if (!token && !canGuestUse("dreamInterpretation")) {
      setGateStep("packages");
      setShowPackages(true);
      return;
    }

    setLoading(true);
    setResult(null);
    try {
      const data = await apiRequest<DreamResult>("/dream-interpretations", {
        token: token || undefined,
        body: { dreamText: text },
      });
      if (data.accessMode === "FREE_PREVIEW") consumeGuestUse("dreamInterpretation");
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
        setError(err instanceof ApiError ? err.message : t("dreamError"));
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <Card className="fade-up">
        <h1 className="font-heading text-2xl text-ink md:text-3xl">{t("dreamTitle")}</h1>
        <p className="mt-2 text-sm text-muted">{t("dreamHint")}</p>
        <div className="mt-4">
          <SubscriptionQuotaBanner service="dreamInterpretation" />
        </div>

        <form className="mt-6 space-y-4" onSubmit={onSubmit}>
          <label className="block space-y-1.5">
            <span className="text-sm text-muted">{t("dreamInputLabel")}</span>
            <textarea
              name="dreamText"
              required
              rows={6}
              value={dreamText}
              onChange={(e) => setDreamText(e.target.value)}
              placeholder={t("dreamInputPlaceholder")}
              className="w-full rounded-xl border border-line bg-[var(--input-bg)] px-3.5 py-3 text-ink outline-none focus:border-[var(--accent-hover)]"
            />
          </label>

          {error ? <p className="text-sm text-[var(--danger)]">{error}</p> : null}

          <Button type="submit" fullWidth disabled={loading || dreamText.trim().length < 8}>
            {loading ? t("dreamGenerating") : t("dreamGenerate")}
          </Button>
          <p className="text-center text-xs text-muted">
            {previewConsumed
              ? t("hadahanaHint")
              : t("guestFreeOnceHint").replace("{count}", String(getGuestFreeLimit()))}
          </p>
        </form>
      </Card>

      {loading ? (
        <Card>
          <p className="font-heading text-accent">{t("dreamGenerating")}</p>
          <p className="mt-2 text-sm text-muted">{t("dreamGeneratingHint")}</p>
        </Card>
      ) : null}

      {result?.report ? (
        <div className="space-y-4">
          <Card>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="font-heading text-xl text-ink">{t("dreamResults")}</h2>
                <p className="mt-1 text-sm text-muted line-clamp-2">{result.dreamText}</p>
              </div>
              <div
                className={`rounded-xl border px-3 py-2 text-center text-sm ${categoryTone(
                  result.report.category,
                )}`}
              >
                <p className="text-[11px] uppercase tracking-wide opacity-80">
                  {t("dreamCategory")}
                </p>
                <p className="font-heading" lang="si">
                  {result.report.category}
                </p>
              </div>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-ink" lang="si">
              {result.report.dream_summary}
            </p>
            <p className="mt-2 text-xs text-muted">
              {t("dreamConfidence")}: {result.report.confidence_score}
            </p>
          </Card>

          <Card>
            <h3 className="font-heading text-accent">{t("dreamMainMeaning")}</h3>
            <p className="mt-3 text-sm leading-relaxed text-ink" lang="si">
              {result.report.main_meaning}
            </p>
          </Card>

          <Card className={result.locked ? "opacity-90" : undefined}>
            <h3 className="font-heading text-accent">{t("dreamDeepAnalysis")}</h3>
            <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-muted" lang="si">
              {result.report.deep_analysis}
            </p>
          </Card>

          <Card className={result.locked ? "opacity-90" : undefined}>
            <h3 className="font-heading text-accent">{t("dreamAdvice")}</h3>
            <p className="mt-3 text-sm leading-relaxed text-ink" lang="si">
              {result.report.actionable_advice}
            </p>
          </Card>

          {result.locked ? (
            <Card>
              <p className="text-sm text-muted">{t("dreamTeaserHint")}</p>
              <div className="mt-3">
                <Button type="button" fullWidth onClick={() => setShowPackages(true)}>
                  {t("subscription")}
                </Button>
              </div>
            </Card>
          ) : null}
        </div>
      ) : null}

      <PackageUpgradeGate
        open={showPackages}
        onClose={() => setShowPackages(false)}
        serviceLabel={t("quotaDream")}
        returnTo="/dream-interpretation"
        initialStep={gateStep}
      />
    </div>
  );
}
