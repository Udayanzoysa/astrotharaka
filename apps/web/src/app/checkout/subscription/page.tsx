"use client";

import Link from "next/link";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { clearPendingCheckout, readPendingCheckout } from "@/lib/guest-usage";
import { packageName, type SubscriptionCheckout, type SubscriptionPackage } from "@/lib/types";
import { useAuth } from "@/components/providers/auth-provider";
import { useUi } from "@/components/providers/ui-provider";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { ApiError, apiRequest } from "@/lib/api";

type PayMethod = "PAYHERE" | "BANK_TRANSFER";

type BankAccount = {
  id: string;
  bankName: string;
  accountHolder: string;
  accountNumber: string;
  branch: string | null;
};

type PaymentResponse = {
  checkout: SubscriptionCheckout;
  checkoutResult?: Record<string, unknown>;
};

function submitPayHereForm(checkout: Record<string, string | undefined>) {
  const form = document.createElement("form");
  form.method = "POST";
  form.action = checkout.actionUrl ?? "";
  form.style.display = "none";
  const skip = new Set(["type", "actionUrl", "paymentId", "mode", "sandboxCompletePath", "checkoutId"]);
  for (const [key, value] of Object.entries(checkout)) {
    if (skip.has(key) || value === undefined) continue;
    const input = document.createElement("input");
    input.type = "hidden";
    input.name = key;
    input.value = value;
    form.appendChild(input);
  }
  document.body.appendChild(form);
  form.submit();
}

function SubscriptionCheckoutInner() {
  const { t, language } = useUi();
  const { user, token, loading } = useAuth();
  const router = useRouter();
  const params = useSearchParams();
  const packageIdParam = params.get("packageId");

  const [packages, setPackages] = useState<SubscriptionPackage[]>([]);
  const [banks, setBanks] = useState<BankAccount[]>([]);
  const [method, setMethod] = useState<PayMethod>("PAYHERE");
  const [checkout, setCheckout] = useState<SubscriptionCheckout | null>(null);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [busy, setBusy] = useState(false);
  const [showBankForm, setShowBankForm] = useState(false);
  const [bankAccountId, setBankAccountId] = useState("");
  const [providerRef, setProviderRef] = useState("");
  const [slipFile, setSlipFile] = useState<File | null>(null);

  const pending = useMemo(() => readPendingCheckout(), []);
  const packageId = packageIdParam || pending?.packageId || "";
  const selected = packages.find((p) => p.id === packageId) ?? null;

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
        if (bankList[0]) setBankAccountId(bankList[0].id);
      } catch {
        setError(t("subscriptionLoadError"));
      }
    })();
  }, [t]);

  async function ensureCheckout() {
    if (!token || !packageId) return null;
    if (checkout) return checkout;
    const created = await apiRequest<SubscriptionCheckout>("/subscriptions/checkouts", {
      token,
      method: "POST",
      body: { packageId },
    });
    setCheckout(created);
    clearPendingCheckout();
    return created;
  }

  async function payPayHere() {
    if (!token) return;
    setBusy(true);
    setError("");
    setInfo("");
    setShowBankForm(false);
    try {
      const c = await ensureCheckout();
      if (!c) return;
      const result = await apiRequest<PaymentResponse>(`/subscriptions/checkouts/${c.id}/payments`, {
        token,
        body: { method: "PAYHERE" },
      });
      setCheckout(result.checkout);
      const ph = result.checkoutResult;
      if (ph?.type === "payhere") {
        submitPayHereForm(ph as Record<string, string | undefined>);
        return;
      }
      if (ph?.type === "payhere_unconfigured") {
        setInfo(String(ph.message ?? t("subscriptionPayHereHint")));
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("subscriptionError"));
    } finally {
      setBusy(false);
    }
  }

  async function submitBankTransfer() {
    if (!token || !slipFile) {
      setError(t("bankSlipRequired"));
      return;
    }
    if (!bankAccountId) {
      setError(t("bankAccountRequired"));
      return;
    }
    if (!providerRef.trim()) {
      setError(t("bankRefRequired"));
      return;
    }
    setBusy(true);
    setError("");
    setInfo("");
    try {
      const c = await ensureCheckout();
      if (!c) return;
      const slipBase64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = String(reader.result || "");
          resolve(result.includes(",") ? result.split(",")[1]! : result);
        };
        reader.onerror = () => reject(new Error("read failed"));
        reader.readAsDataURL(slipFile);
      });

      const result = await apiRequest<PaymentResponse>(`/subscriptions/checkouts/${c.id}/payments`, {
        token,
        body: {
          method: "BANK_TRANSFER",
          bankAccountId,
          providerRef: providerRef.trim(),
          slipBase64,
          slipFileName: slipFile.name,
          slipMimeType: slipFile.type || "application/pdf",
        },
      });
      setCheckout(result.checkout);
      setInfo(t("subscriptionBankSubmitted"));
      router.push(`/checkout/subscription/${c.id}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("subscriptionError"));
    } finally {
      setBusy(false);
    }
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
          </div>
        ) : (
          <p className="mt-4 text-sm text-[var(--danger)]">{t("subscriptionLoadError")}</p>
        )}

        <div className="mt-6 space-y-2">
          <p className="text-sm text-muted">{t("paymentMethod")}</p>
          {(
            [
              ["PAYHERE", t("payPayHere")],
              ["BANK_TRANSFER", t("payBank")],
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
                onChange={() => {
                  setMethod(value);
                  setShowBankForm(value === "BANK_TRANSFER");
                }}
                className="accent-[var(--accent)]"
              />
              {label}
            </label>
          ))}
        </div>

        {method === "BANK_TRANSFER" && showBankForm ? (
          <div className="mt-5 space-y-3 rounded-xl border border-dashed border-line p-4 text-sm">
            <p className="text-muted">{t("bankTransferHint")}</p>
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
            <label className="block text-sm text-muted">
              {t("bankAccountPaidTo")}
              <select
                className="mt-1 min-h-11 w-full rounded-xl border border-line bg-[var(--input-bg)] px-3 text-ink"
                value={bankAccountId}
                onChange={(e) => setBankAccountId(e.target.value)}
              >
                {banks.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.bankName} — {b.accountNumber}
                  </option>
                ))}
              </select>
            </label>
            <Field
              label={t("bankTransferRef")}
              name="providerRef"
              value={providerRef}
              onChange={(e) => setProviderRef(e.target.value)}
              placeholder="TXN-123456"
            />
            <label className="block text-sm text-muted">
              {t("bankSlipUpload")}
              <input
                type="file"
                accept="image/*,application/pdf"
                className="mt-1 block w-full text-sm text-ink"
                onChange={(e) => setSlipFile(e.target.files?.[0] ?? null)}
              />
            </label>
            <Button fullWidth disabled={busy} onClick={() => void submitBankTransfer()}>
              {busy ? t("saving") : t("submitBankTransfer")}
            </Button>
          </div>
        ) : (
          <Button
            className="mt-6"
            fullWidth
            disabled={busy || !selected}
            onClick={() => void (method === "PAYHERE" ? payPayHere() : setShowBankForm(true))}
          >
            {busy ? t("saving") : method === "PAYHERE" ? t("payPayHere") : t("payBank")}
          </Button>
        )}

        {error ? <p className="mt-3 text-sm text-[var(--danger)]">{error}</p> : null}
        {info ? <p className="mt-3 text-sm text-ink">{info}</p> : null}

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
