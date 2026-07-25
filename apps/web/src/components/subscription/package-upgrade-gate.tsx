"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ApiError, apiRequest } from "@/lib/api";
import { writeBirthDraft, readBirthDraft } from "@/lib/birth-draft";
import { savePendingCheckout } from "@/lib/guest-usage";
import {
  packageName,
  type Language,
  type RegisterPendingResponse,
  type SubscriptionPackage,
} from "@/lib/types";
import { useAuth } from "@/components/providers/auth-provider";
import { useUi } from "@/components/providers/ui-provider";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field } from "@/components/ui/field";

type Step = "packages" | "account";

type Props = {
  open: boolean;
  onClose: () => void;
  serviceLabel: string;
  returnTo?: string;
  /** When guest already used free preview, start on account/login. */
  initialStep?: Step;
};

export function PackageUpgradeGate({
  open,
  onClose,
  serviceLabel,
  returnTo = "/",
  initialStep = "packages",
}: Props) {
  const { t, language } = useUi();
  const { user } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState<Step>("packages");
  const [packages, setPackages] = useState<SubscriptionPackage[]>([]);
  const [selected, setSelected] = useState<SubscriptionPackage | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const draft = typeof window !== "undefined" ? readBirthDraft() : null;

  useEffect(() => {
    if (!open) return;
    setStep(user ? "packages" : initialStep);
    setSelected(null);
    setError("");
    void (async () => {
      try {
        const data = await apiRequest<SubscriptionPackage[]>("/subscriptions/packages");
        setPackages(data);
      } catch {
        setError(t("subscriptionLoadError"));
      }
    })();
  }, [open, t, user, initialStep]);

  function pickPackage(pkg: SubscriptionPackage) {
    setSelected(pkg);
    savePendingCheckout({
      packageId: pkg.id,
      packageCode: pkg.code,
      packageName: packageName(pkg, language),
      priceLkr: pkg.priceLkr,
      returnTo,
    });
    // Logged-in users skip account creation → payment
    if (user) {
      onClose();
      router.push(`/checkout/subscription?packageId=${pkg.id}`);
      return;
    }
    setStep("account");
  }

  async function onCreateAccount(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!selected) return;
    setBusy(true);
    setError("");
    const form = new FormData(e.currentTarget);
    const email = String(form.get("email") ?? "").trim().toLowerCase();
    const fullName = String(form.get("fullName") ?? "").trim();
    const password = String(form.get("password") ?? "");
    const mobileNumber = String(form.get("mobileNumber") ?? "").trim() || undefined;

    writeBirthDraft({
      fullName,
      email,
      mobileNumber,
      language: language as Language,
      source: "guest",
    });
    savePendingCheckout({
      packageId: selected.id,
      packageCode: selected.code,
      packageName: packageName(selected, language),
      priceLkr: selected.priceLkr,
      returnTo,
    });

    try {
      const result = await apiRequest<RegisterPendingResponse>("/auth/register", {
        body: {
          email,
          password,
          fullName,
          mobileNumber,
          preferredLanguage: language,
        },
      });
      const q = new URLSearchParams({
        email,
        next: `/checkout/subscription?packageId=${selected.id}`,
      });
      if (result.devCode) q.set("devCode", result.devCode);
      router.push(`/verify-email?${q.toString()}`);
    } catch (err) {
      if (err instanceof ApiError && err.code === "EMAIL_ALREADY_REGISTERED") {
        setError(t("accountExists"));
      } else {
        setError(err instanceof ApiError ? err.message : t("subscriptionError"));
      }
    } finally {
      setBusy(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <Card className="max-h-[90vh] w-full max-w-lg overflow-y-auto">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.14em] text-accent">{t("availableServices")}</p>
            <h2 className="mt-1 font-heading text-xl text-ink">{t("guestLimitTitle")}</h2>
            <p className="mt-1 text-sm text-muted">
              {t("guestLimitHint").replace("{service}", serviceLabel)}
            </p>
          </div>
          <button type="button" className="text-muted hover:text-ink" onClick={onClose}>
            ✕
          </button>
        </div>

        {step === "packages" ? (
          <div className="mt-5 space-y-3">
            {packages.map((pkg) => (
              <button
                key={pkg.id}
                type="button"
                onClick={() => pickPackage(pkg)}
                className="w-full rounded-xl border border-line bg-[var(--input-bg)] p-4 text-left transition hover:border-accent/50"
              >
                <p className="font-heading text-accent">{packageName(pkg, language)}</p>
                <p className="mt-1 text-lg text-ink">LKR {pkg.priceLkr.toLocaleString()}/mo</p>
                <p className="mt-1 text-xs text-muted">
                  {t("quotaBabyNames")} {pkg.babyNamesQuota} · {t("quotaPorondam")}{" "}
                  {pkg.porondamQuota} · {t("quotaHoroscope")} {pkg.horoscopeQuota}
                </p>
              </button>
            ))}
            {error ? <p className="text-sm text-[var(--danger)]">{error}</p> : null}
            <p className="text-center text-xs text-muted">
              <Link href="/login" className="text-accent hover:underline">
                {t("login")}
              </Link>
            </p>
          </div>
        ) : (
          <form className="mt-5 space-y-4" onSubmit={onCreateAccount}>
            <p className="text-sm text-muted">
              {t("guestCreateAccountHint")}{" "}
              <span className="text-accent">
                {selected ? packageName(selected, language) : ""}
              </span>
            </p>
            <Field
              label={t("fullName")}
              name="fullName"
              required
              defaultValue={draft?.fullName ?? ""}
            />
            <Field
              label={t("email")}
              name="email"
              type="email"
              required
              defaultValue={draft?.email ?? ""}
            />
            <Field label={t("password")} name="password" type="password" required minLength={8} />
            <Field
              label={t("mobile")}
              name="mobileNumber"
              type="tel"
              defaultValue={draft?.mobileNumber ?? ""}
            />
            {error ? <p className="text-sm text-[var(--danger)]">{error}</p> : null}
            <div className="flex gap-2">
              <Button type="button" variant="ghost" onClick={() => setStep("packages")}>
                {t("back")}
              </Button>
              <Button type="submit" fullWidth disabled={busy}>
                {busy ? t("saving") : t("guestCreateAccount")}
              </Button>
            </div>
          </form>
        )}
      </Card>
    </div>
  );
}
