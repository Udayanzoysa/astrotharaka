"use client";

import Link from "next/link";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { clearPendingCheckout, readPendingCheckout } from "@/lib/guest-usage";
import { packageName, type SubscriptionPackage } from "@/lib/types";
import { useAuth } from "@/components/providers/auth-provider";
import { useUi } from "@/components/providers/ui-provider";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { apiRequest } from "@/lib/api";

type PayMethod = "PAYHERE" | "BANK_TRANSFER";
type BankAccount = {
  id: string;
  bankName: string;
  accountHolder: string;
  accountNumber: string;
  branch: string | null;
};

function SubscriptionCheckoutInner() {
  const { t, language } = useUi();
  const { user, loading } = useAuth();
  const router = useRouter();
  const params = useSearchParams();
  const packageIdParam = params.get("packageId");

  const [packages, setPackages] = useState<SubscriptionPackage[]>([]);
  const [banks, setBanks] = useState<BankAccount[]>([]);
  const [method, setMethod] = useState<PayMethod>("BANK_TRANSFER");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [bankSubmitted, setBankSubmitted] = useState(false);

  const pending = useMemo(() => readPendingCheckout(), []);
  const packageId = packageIdParam || pending?.packageId || "";

  useEffect(() => {
    if (!loading && !user) {
      router.replace(`/login?next=/checkout/subscription?packageId=${packageId}`);
    }
  }, [loading, user, router, packageId]);

  useEffect(() => {
    void (async () => {
      try {
        const [pkgs, bankList] = await Promise.all([
          apiRequest<SubscriptionPackage[]>("/subscriptions/packages"),
          apiRequest<BankAccount[]>("/bank-accounts"),
        ]);
        setPackages(pkgs);
        setBanks(bankList);
      } catch {
        setError(t("subscriptionLoadError"));
      }
    })();
  }, [t]);

  const selected = packages.find((p) => p.id === packageId) ?? null;

  async function onPay() {
    if (!selected) return;
    if (method === "BANK_TRANSFER") {
      setBankSubmitted(true);
      clearPendingCheckout();
      return;
    }
    setError(t("subscriptionPayHereHint"));
  }

  if (loading || !user) {
    return <div className="mx-auto max-w-lg px-4 py-16 text-muted">Loading…</div>;
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-8 md:py-12">
      <Card className="fade-up">
        <p className="text-xs uppercase tracking-[0.14em] text-accent">{t("checkout")}</p>
        <h1 className="mt-1 font-heading text-2xl text-ink">{t("subscriptionCheckoutTitle")}</h1>

        {selected ? (
          <div className="mt-4 rounded-xl border border-line bg-[var(--input-bg)] p-4">
            <p className="font-heading text-accent">{packageName(selected, language)}</p>
            <p className="mt-1 text-2xl text-ink">LKR {selected.priceLkr.toLocaleString()}</p>
            <p className="mt-1 text-xs text-muted">
              {t("quotaBabyNames")} {selected.babyNamesQuota} · {t("quotaPorondam")}{" "}
              {selected.porondamQuota} · {t("quotaHoroscope")} {selected.horoscopeQuota}
            </p>
          </div>
        ) : (
          <p className="mt-4 text-sm text-[var(--danger)]">{t("subscriptionLoadError")}</p>
        )}

        <div className="mt-6 space-y-2">
          <p className="text-sm text-muted">{t("paymentMethod")}</p>
          {(
            [
              ["BANK_TRANSFER", t("payBank")],
              ["PAYHERE", t("payPayHere")],
            ] as const
          ).map(([value, label]) => (
            <label
              key={value}
              className="flex cursor-pointer items-center gap-3 rounded-xl border border-line px-3 py-3 text-sm"
            >
              <input
                type="radio"
                name="method"
                checked={method === value}
                onChange={() => setMethod(value)}
                className="accent-[var(--accent)]"
              />
              {label}
            </label>
          ))}
        </div>

        {bankSubmitted ? (
          <div className="mt-5 space-y-3 rounded-xl border border-dashed border-line p-4 text-sm text-muted">
            <p>{t("bankTransferHint")}</p>
            <p className="font-medium text-ink">
              {t("bankTransferPackageRef")}: {selected?.code ?? packageId}
            </p>
            <div className="space-y-2">
              {banks.map((bank) => (
                <div key={bank.id} className="rounded-lg border border-line px-3 py-2 text-ink">
                  <p className="font-heading text-accent">{bank.bankName}</p>
                  <p>{bank.accountHolder}</p>
                  <p className="text-sm text-muted">
                    {bank.accountNumber}
                    {bank.branch ? ` · ${bank.branch}` : ""}
                  </p>
                </div>
              ))}
            </div>
            <p className="text-ink">{t("subscriptionAwaitingActivation")}</p>
            <Button
              className="mt-2"
              fullWidth
              variant="ghost"
              onClick={() => router.push("/subscription")}
            >
              {t("subscription")}
            </Button>
          </div>
        ) : (
          <Button
            className="mt-6"
            fullWidth
            disabled={busy || !selected}
            onClick={() => {
              setBusy(true);
              void onPay().finally(() => setBusy(false));
            }}
          >
            {busy ? t("saving") : t("payNow")}
          </Button>
        )}

        {error ? <p className="mt-3 text-sm text-[var(--danger)]">{error}</p> : null}

        <p className="mt-4 text-center text-xs text-muted">
          <Link href="/subscription" className="text-accent hover:underline">
            {t("subscription")}
          </Link>
        </p>
      </Card>
    </div>
  );
}

export default function SubscriptionCheckoutPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-lg px-4 py-16 text-muted">Loading…</div>}>
      <SubscriptionCheckoutInner />
    </Suspense>
  );
}
