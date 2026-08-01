"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ApiError, apiRequest } from "@/lib/api";
import { type SubscriptionCheckout } from "@/lib/types";
import { AdminStatusBadge } from "@/components/admin/admin-status-badge";
import { useAdminAccess } from "@/components/admin/use-admin-access";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field } from "@/components/ui/field";

type BankAccount = {
  id: string;
  bankName: string;
  accountNumber: string;
};

export default function AdminSubscriptionPaymentDetailPage() {
  const { token, loading, denied, allowed } = useAdminAccess({
    roles: ["CONTENT", "SUPER_ADMIN", "FINANCE"],
  });
  const params = useParams<{ id: string }>();
  const [checkout, setCheckout] = useState<SubscriptionCheckout | null>(null);
  const [banks, setBanks] = useState<BankAccount[]>([]);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [busy, setBusy] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [bankAccountId, setBankAccountId] = useState("");
  const [providerRef, setProviderRef] = useState("");
  const [slipFile, setSlipFile] = useState<File | null>(null);

  async function load() {
    if (!token) return;
    const res = await apiRequest<SubscriptionCheckout>(
      `/admin/subscription-checkouts/${params.id}`,
      { token },
    );
    setCheckout(res);
  }

  useEffect(() => {
    if (!allowed || !token) return;
    void (async () => {
      try {
        await load();
        const bankList = await apiRequest<BankAccount[]>("/bank-accounts");
        setBanks(bankList);
        if (bankList[0]) setBankAccountId(bankList[0].id);
      } catch {
        setError("Failed to load checkout");
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allowed, token, params.id]);

  async function approve() {
    if (!token) return;
    setBusy(true);
    setError("");
    try {
      const res = await apiRequest<SubscriptionCheckout>(
        `/admin/subscription-checkouts/${params.id}/confirm`,
        { token, method: "PATCH" },
      );
      setCheckout(res);
      setInfo("Subscription activated.");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Approve failed");
    } finally {
      setBusy(false);
    }
  }

  async function reject() {
    if (!token) return;
    setBusy(true);
    setError("");
    try {
      const res = await apiRequest<SubscriptionCheckout>(
        `/admin/subscription-checkouts/${params.id}/reject`,
        { token, method: "PATCH" },
      );
      setCheckout(res);
      setInfo("Payment rejected.");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Reject failed");
    } finally {
      setBusy(false);
    }
  }

  async function uploadSlipForUser() {
    if (!token || !slipFile || !providerRef.trim() || !bankAccountId) {
      setError("Reference, bank account, and slip file are required");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const slipBase64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = String(reader.result || "");
          resolve(result.includes(",") ? result.split(",")[1]! : result);
        };
        reader.onerror = () => reject(new Error("read failed"));
        reader.readAsDataURL(slipFile);
      });

      await apiRequest(`/admin/subscription-checkouts/${params.id}/payments`, {
        token,
        method: "POST",
        body: {
          method: "BANK_TRANSFER",
          bankAccountId,
          providerRef: providerRef.trim(),
          slipBase64,
          slipFileName: slipFile.name,
          slipMimeType: slipFile.type || "application/pdf",
        },
      });
      await load();
      setShowUpload(false);
      setInfo("Bank slip uploaded on behalf of user.");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Upload failed");
    } finally {
      setBusy(false);
    }
  }

  async function viewSlip(paymentId: string) {
    if (!token) return;
    try {
      const base = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000/api/v1";
      const res = await fetch(
        `${base}/admin/subscription-checkouts/${params.id}/payments/${paymentId}/slip`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      if (!res.ok) throw new Error("slip fetch failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank");
    } catch {
      setError("Could not open bank slip");
    }
  }

  if (loading) return <p className="text-muted">Loading…</p>;
  if (denied) return <p className="text-sm text-[var(--danger)]">{denied}</p>;
  if (!allowed) return null;
  if (!checkout) return <p className="text-muted">Loading checkout…</p>;

  const pendingReview =
    checkout.status === "PAYMENT_UNDER_REVIEW" || checkout.status === "AWAITING_PAYMENT";
  const latestPayment = checkout.payments?.[0];

  return (
    <div className="space-y-4">
      <Link href="/admin/subscription-payments" className="text-sm text-accent hover:underline">
        ← Subscription payments
      </Link>

      <Card>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="font-heading text-2xl text-ink">{checkout.checkoutNumber}</h1>
            <p className="text-sm text-muted">
              {checkout.userName} · {checkout.userEmail}
            </p>
            {checkout.userMobile || checkout.userWhatsapp ? (
              <p className="text-sm text-muted">
                {checkout.userMobile ? `Mobile: ${checkout.userMobile}` : null}
                {checkout.userMobile && checkout.userWhatsapp ? " · " : null}
                {checkout.userWhatsapp ? `WhatsApp: ${checkout.userWhatsapp}` : null}
              </p>
            ) : null}
            <p className="mt-1 text-ink">{checkout.packageNameEn}</p>
            <p className="text-lg text-accent">LKR {checkout.priceLkr.toLocaleString()}</p>
          </div>
          <AdminStatusBadge status={checkout.status} />
        </div>

        {latestPayment ? (
          <div className="mt-4 rounded-xl border border-line p-3 text-sm">
            <p className="text-muted">Latest payment</p>
            <p className="text-ink">
              {latestPayment.method} · {latestPayment.status}
            </p>
            {latestPayment.providerRef ? (
              <p className="text-muted">Ref: {latestPayment.providerRef}</p>
            ) : null}
            {latestPayment.hasBankSlip ? (
              <Button
                variant="ghost"
                className="mt-2 min-h-9 px-3 text-xs"
                onClick={() => viewSlip(latestPayment.id)}
              >
                View bank slip
              </Button>
            ) : null}
          </div>
        ) : null}

        <div className="mt-4 flex flex-wrap gap-2">
          {pendingReview ? (
            <>
              <Button disabled={busy} onClick={() => void approve()}>
                Approve & activate
              </Button>
              <Button variant="ghost" disabled={busy} onClick={() => void reject()}>
                Reject
              </Button>
              <Button variant="ghost" disabled={busy} onClick={() => setShowUpload((v) => !v)}>
                Upload slip for user
              </Button>
            </>
          ) : null}
        </div>

        {showUpload ? (
          <div className="mt-4 space-y-3 rounded-xl border border-dashed border-line p-4">
            <Field
              label="Transaction / reference number"
              name="providerRef"
              value={providerRef}
              onChange={(e) => setProviderRef(e.target.value)}
            />
            <label className="block text-sm text-muted">
              Paid to account
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
            <label className="block text-sm text-muted">
              Bank slip
              <input
                type="file"
                accept="image/*,application/pdf"
                className="mt-1 block w-full text-sm"
                onChange={(e) => setSlipFile(e.target.files?.[0] ?? null)}
              />
            </label>
            <Button disabled={busy} onClick={() => void uploadSlipForUser()}>
              Submit slip
            </Button>
          </div>
        ) : null}

        {error ? <p className="mt-3 text-sm text-[var(--danger)]">{error}</p> : null}
        {info ? <p className="mt-3 text-sm text-ink">{info}</p> : null}
      </Card>
    </div>
  );
}
