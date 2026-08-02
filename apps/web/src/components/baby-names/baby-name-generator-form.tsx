"use client";

import { FormEvent, useEffect, useState } from "react";
import { ApiError, apiRequest } from "@/lib/api";
import { readBirthDraft, writeBirthDraft } from "@/lib/birth-draft";
import { canGuestUse, consumeGuestUse, getGuestFreeLimit } from "@/lib/guest-usage";
import { useAuth } from "@/components/providers/auth-provider";
import { useUi } from "@/components/providers/ui-provider";
import { usePreviewConsumed } from "@/hooks/use-preview-consumed";
import { PackageUpgradeGate } from "@/components/subscription/package-upgrade-gate";
import { SubscriptionQuotaBanner } from "@/components/subscription/subscription-quota-banner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field } from "@/components/ui/field";

type StyleTag = "Traditional" | "Modern" | "SouthIndian" | "Unique";

type BabyNameItem = { name: string; meaning: string; style_tag?: StyleTag };

type BabyNameResult = {
  token: string;
  birthPlaceName: string;
  firstLetter: string;
  secondLetter: string;
  gender: string | null;
  styles: StyleTag[];
  names: BabyNameItem[];
  aiModel: string | null;
};

const SINHALA_LETTERS = [
  "අ", "ආ", "ඇ", "ඈ", "ඉ", "ඊ", "උ", "ඌ", "එ", "ඒ", "ඔ", "ඕ",
  "ක", "ඛ", "ග", "ඝ", "ච", "ඡ", "ජ", "ට", "ඨ", "ඩ", "ත", "ථ", "ද", "ධ", "න",
  "ප", "ඵ", "බ", "භ", "ම", "ය", "ර", "ල", "ව", "ශ", "ෂ", "ස", "හ", "ළ", "ෆ",
  "ඤ", "ඥ",
];

const STYLE_OPTIONS: Array<{ value: StyleTag; labelKey: string }> = [
  { value: "Traditional", labelKey: "babyNamesStyleTraditional" },
  { value: "Modern", labelKey: "babyNamesStyleModern" },
  { value: "SouthIndian", labelKey: "babyNamesStyleSouthIndian" },
  { value: "Unique", labelKey: "babyNamesStyleUnique" },
];

function styleLabel(tag: StyleTag | undefined, t: (k: string) => string): string {
  if (tag === "Modern") return t("babyNamesStyleModern");
  if (tag === "SouthIndian") return t("babyNamesStyleSouthIndian");
  if (tag === "Unique") return t("babyNamesStyleUnique");
  return t("babyNamesStyleTraditional");
}

export function BabyNameGeneratorForm() {
  const { t } = useUi();
  const { user, token } = useAuth();
  const previewConsumed = usePreviewConsumed();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<BabyNameResult | null>(null);
  const [showPackages, setShowPackages] = useState(false);
  const [gateStep, setGateStep] = useState<"packages" | "account">("packages");
  const [prefill, setPrefill] = useState({ birthDate: "", birthTime: "", birthPlaceName: "" });
  const [styles, setStyles] = useState<StyleTag[]>([
    "Traditional",
    "Modern",
    "SouthIndian",
    "Unique",
  ]);

  useEffect(() => {
    const draft = readBirthDraft();
    setPrefill({
      birthDate: user?.profile?.birthDate || draft?.birthDate || "",
      birthTime: user?.profile?.birthTime || draft?.birthTime || "",
      birthPlaceName: user?.profile?.birthPlaceName || draft?.birthPlaceName || "",
    });
  }, [user]);

  function toggleStyle(value: StyleTag) {
    setStyles((prev) => {
      if (prev.includes(value)) {
        if (prev.length === 1) return prev;
        return prev.filter((s) => s !== value);
      }
      return [...prev, value];
    });
  }

  function persistDraft(form: FormData) {
    writeBirthDraft({
      fullName: user?.profile?.fullName || readBirthDraft()?.fullName,
      email: user?.email || readBirthDraft()?.email,
      birthDate: String(form.get("birthDate") ?? "") || undefined,
      birthTime: String(form.get("birthTime") ?? "") || undefined,
      birthPlaceName: String(form.get("birthPlaceName") ?? "") || undefined,
      source: user ? "profile" : "guest",
    });
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const form = new FormData(e.currentTarget);
    persistDraft(form);

    if (!token && !canGuestUse("babyNames")) {
      setGateStep("packages");
      setShowPackages(true);
      return;
    }

    setLoading(true);
    setResult(null);
    const genderRaw = String(form.get("gender") ?? "");
    try {
      const data = await apiRequest<BabyNameResult & { accessMode?: string }>("/baby-names", {
        token: token || undefined,
        body: {
          birthDate: String(form.get("birthDate") ?? ""),
          birthTime: String(form.get("birthTime") ?? "") || undefined,
          birthPlaceName: String(form.get("birthPlaceName") ?? ""),
          firstLetter: String(form.get("firstLetter") ?? ""),
          secondLetter: String(form.get("secondLetter") ?? ""),
          gender: genderRaw || undefined,
          styles,
        },
      });
      if (data.accessMode === "FREE_PREVIEW") consumeGuestUse("babyNames");
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
        setError(err instanceof ApiError ? err.message : t("babyNamesError"));
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <Card className="fade-up">
        <h1 className="font-heading text-2xl text-ink md:text-3xl">{t("babyNamesTitle")}</h1>
        <p className="mt-2 text-sm text-muted">{t("babyNamesHint")}</p>
        <div className="mt-4">
          <SubscriptionQuotaBanner service="babyNames" />
        </div>

        <form className="mt-6 space-y-4" onSubmit={onSubmit} key={`${prefill.birthDate}-${prefill.birthPlaceName}`}>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label={t("birthDate")}
              name="birthDate"
              type="date"
              required
              defaultValue={prefill.birthDate}
            />
            <Field
              label={t("birthTime")}
              name="birthTime"
              type="time"
              defaultValue={prefill.birthTime}
            />
          </div>
          <Field
            label={t("birthPlace")}
            name="birthPlaceName"
            required
            minLength={2}
            placeholder="Colombo, Kandy, Galle…"
            defaultValue={prefill.birthPlaceName}
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block space-y-1.5 text-sm">
              <span className="text-muted">{t("babyNamesFirstLetter")}</span>
              <select
                name="firstLetter"
                required
                className="min-h-11 w-full rounded-xl border border-line bg-[var(--input-bg)] px-3.5 text-ink outline-none focus:border-[var(--accent-hover)]"
                defaultValue="උ"
              >
                {SINHALA_LETTERS.map((l) => (
                  <option key={`f-${l}`} value={l}>
                    {l}
                  </option>
                ))}
              </select>
            </label>
            <label className="block space-y-1.5 text-sm">
              <span className="text-muted">{t("babyNamesSecondLetter")}</span>
              <select
                name="secondLetter"
                required
                className="min-h-11 w-full rounded-xl border border-line bg-[var(--input-bg)] px-3.5 text-ink outline-none focus:border-[var(--accent-hover)]"
                defaultValue="ඤ"
              >
                {SINHALA_LETTERS.map((l) => (
                  <option key={`s-${l}`} value={l}>
                    {l}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <fieldset>
            <legend className="mb-2 text-sm text-muted">{t("babyNamesStyles")}</legend>
            <div className="grid gap-2 sm:grid-cols-2">
              {STYLE_OPTIONS.map((opt) => {
                const checked = styles.includes(opt.value);
                return (
                  <label
                    key={opt.value}
                    className={`flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2.5 text-sm transition ${
                      checked
                        ? "border-accent/50 bg-[color-mix(in_srgb,var(--accent)_12%,transparent)] text-ink"
                        : "border-line text-muted hover:text-ink"
                    }`}
                  >
                    <input
                      type="checkbox"
                      className="accent-[var(--accent)]"
                      checked={checked}
                      onChange={() => toggleStyle(opt.value)}
                    />
                    {t(opt.labelKey)}
                  </label>
                );
              })}
            </div>
            <p className="mt-2 text-xs text-muted">{t("babyNamesStylesHint")}</p>
          </fieldset>

          <label className="block space-y-1.5 text-sm">
            <span className="text-muted">{t("babyNamesGenderOptional")}</span>
            <select
              name="gender"
              className="min-h-11 w-full rounded-xl border border-line bg-[var(--input-bg)] px-3.5 text-ink outline-none focus:border-[var(--accent-hover)]"
              defaultValue=""
            >
              <option value="">{t("babyNamesGenderAny")}</option>
              <option value="male">{t("genderMale")}</option>
              <option value="female">{t("genderFemale")}</option>
            </select>
          </label>

          {error ? <p className="text-sm text-[var(--danger)]">{error}</p> : null}

          <Button type="submit" fullWidth disabled={loading}>
            {loading ? t("babyNamesGenerating") : t("babyNamesGenerate")}
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
          <p className="font-heading text-accent">{t("babyNamesGenerating")}</p>
          <p className="mt-2 text-sm text-muted">{t("babyNamesGeneratingHint")}</p>
        </Card>
      ) : null}

      {result ? (
        <Card>
          <div className="flex flex-wrap items-end justify-between gap-2">
            <div>
              <h2 className="font-heading text-xl text-ink">{t("babyNamesResults")}</h2>
              <p className="mt-1 text-sm text-muted">
                {result.firstLetter} · {result.secondLetter}
                {result.gender ? ` · ${result.gender}` : ""} · {result.birthPlaceName}
              </p>
              {result.styles?.length ? (
                <p className="mt-1 text-xs text-muted">
                  {result.styles.map((s) => styleLabel(s, t)).join(" · ")}
                </p>
              ) : null}
            </div>
            <p className="text-xs text-muted">{result.names.length} names</p>
          </div>

          <ol className="mt-5 space-y-3">
            {result.names.map((item, i) => (
              <li
                key={`${item.name}-${i}`}
                className="rounded-xl border border-line bg-[var(--input-bg)] px-4 py-3"
              >
                <div className="flex gap-3">
                  <span className="font-heading text-sm text-accent">{i + 1}.</span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-heading text-lg text-ink" lang="si">
                        {item.name}
                      </p>
                      <span className="rounded-md border border-line px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-accent">
                        {styleLabel(item.style_tag, t)}
                      </span>
                    </div>
                    <p className="mt-1 text-sm leading-relaxed text-muted" lang="si">
                      {item.meaning}
                    </p>
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </Card>
      ) : null}

      <PackageUpgradeGate
        open={showPackages}
        onClose={() => setShowPackages(false)}
        serviceLabel={t("quotaBabyNames")}
        returnTo="/baby-names"
        initialStep={gateStep}
      />
    </div>
  );
}
