"use client";

import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ApiError, apiRequest } from "@/lib/api";
import { productName, type Order, type OrderReportView } from "@/lib/types";
import { useAuth } from "@/components/providers/auth-provider";
import { useUi } from "@/components/providers/ui-provider";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field } from "@/components/ui/field";

const STEPS = [
  "AWAITING_PAYMENT",
  "PAYMENT_UNDER_REVIEW",
  "PAID",
  "GENERATING",
  "COMPLETED",
] as const;

type CheckoutResult = {
  order: Order;
  checkout?: Record<string, string | undefined> & {
    type?: string;
    message?: string;
    mode?: string;
  };
};

type ReportSection = { heading: string; body: string };

function parseReportSections(contentText: string | null | undefined, fallbackTitle: string): {
  title: string;
  sections: ReportSection[];
} {
  if (!contentText?.trim()) {
    return { title: fallbackTitle, sections: [] };
  }
  const parts = contentText
    .split(/^##\s+/m)
    .map((p) => p.trim())
    .filter(Boolean);
  if (parts.length <= 1 && !contentText.includes("## ")) {
    return { title: fallbackTitle, sections: [{ heading: fallbackTitle, body: contentText.trim() }] };
  }
  const title = parts[0]?.includes("\n") ? parts[0].split("\n")[0].trim() : parts[0] || fallbackTitle;
  const sections: ReportSection[] = [];
  for (const part of parts.slice(contentText.trimStart().startsWith("##") ? 0 : 1)) {
    const nl = part.indexOf("\n");
    if (nl === -1) {
      sections.push({ heading: part.slice(0, 120), body: part });
    } else {
      sections.push({ heading: part.slice(0, nl).trim(), body: part.slice(nl + 1).trim() });
    }
  }
  return { title: title || fallbackTitle, sections };
}

function submitPayHereForm(checkout: Record<string, string | undefined>) {
  const actionUrl = checkout.actionUrl;
  if (!actionUrl) return;
  const form = document.createElement("form");
  form.method = "POST";
  form.action = actionUrl;
  const keys = [
    "merchant_id",
    "return_url",
    "cancel_url",
    "notify_url",
    "order_id",
    "items",
    "currency",
    "amount",
    "hash",
    "first_name",
    "last_name",
    "email",
    "phone",
    "address",
    "city",
    "country",
  ];
  for (const key of keys) {
    const value = checkout[key];
    if (!value) continue;
    const input = document.createElement("input");
    input.type = "hidden";
    input.name = key;
    input.value = value;
    form.appendChild(input);
  }
  document.body.appendChild(form);
  form.submit();
}

function KundaliPreview({ token, chartSvgUrl }: { token: string; chartSvgUrl: string }) {
  const [src, setSrc] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let objectUrl: string | null = null;
    const path = chartSvgUrl.replace(/^\/api\/v1/, "");
    void (async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000/api/v1"}${path}`,
          { headers: { Authorization: `Bearer ${token}` } },
        );
        if (!res.ok) throw new Error("chart fetch failed");
        const blob = await res.blob();
        objectUrl = URL.createObjectURL(blob);
        setSrc(objectUrl);
      } catch {
        setFailed(true);
      }
    })();
    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [token, chartSvgUrl]);

  if (failed) return <p className="text-sm text-muted">Kundali preview unavailable.</p>;
  if (!src) return <p className="text-sm text-muted">Loading chart…</p>;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt="Kundali chart" className="mx-auto max-h-[420px] max-w-full" />
  );
}

function OrderDetailInner() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const { token, user, loading } = useAuth();
  const { t } = useUi();
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [report, setReport] = useState<OrderReportView | null>(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [busy, setBusy] = useState(false);
  const [showBankForm, setShowBankForm] = useState(false);
  const [banks, setBanks] = useState<
    Array<{
      id: string;
      bankName: string;
      accountHolder: string;
      accountNumber: string;
      branch: string | null;
    }>
  >([]);
  const [bankAccountId, setBankAccountId] = useState("");
  const [providerRef, setProviderRef] = useState("");
  const [slipFile, setSlipFile] = useState<File | null>(null);
  const sandboxHandled = useRef(false);

  const refresh = useCallback(async () => {
    if (!token) return;
    const data = await apiRequest<Order>(`/orders/${params.id}`, { token });
    setOrder(data);
    return data;
  }, [token, params.id]);

  const loadReport = useCallback(async () => {
    if (!token) return;
    setReportLoading(true);
    try {
      const data = await apiRequest<OrderReportView>(`/orders/${params.id}/report`, { token });
      setReport(data);
    } catch {
      setReport(null);
    } finally {
      setReportLoading(false);
    }
  }, [token, params.id]);

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, user, router]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  // PayHere return: refresh order. Sandbox auto-complete only when explicitly enabled.
  useEffect(() => {
    const flag = searchParams.get("payhere");
    if (!token || !flag || sandboxHandled.current) return;
    if (flag === "cancel") {
      setInfo("PayHere checkout was cancelled.");
      router.replace(`/orders/${params.id}`);
      return;
    }
    if (flag !== "return") return;

    sandboxHandled.current = true;
    void (async () => {
      setBusy(true);
      const allowSandbox =
        process.env.NEXT_PUBLIC_ALLOW_DEV_PAYMENTS === "true" &&
        process.env.NODE_ENV !== "production";
      try {
        if (allowSandbox) {
          setInfo("Confirming PayHere sandbox payment…");
          await apiRequest("/public/payments/payhere/sandbox-complete", {
            token,
            body: { orderId: params.id },
          });
          setInfo("PayHere sandbox payment confirmed.");
        } else {
          setInfo("Payment received — waiting for confirmation…");
        }
        await refresh();
      } catch (err) {
        setError(err instanceof ApiError ? err.message : "Payment confirmation failed");
      } finally {
        setBusy(false);
        router.replace(`/orders/${params.id}`);
      }
    })();
  }, [searchParams, token, params.id, refresh, router]);

  useEffect(() => {
    if (!order) return;
    if (order.status === "GENERATING" || order.status === "PAID") {
      const timer = window.setInterval(() => {
        void refresh();
      }, 2500);
      return () => window.clearInterval(timer);
    }
  }, [order, refresh]);

  const ready = order?.reports.some((r) => r.status === "READY") ?? false;

  useEffect(() => {
    if (ready) void loadReport();
  }, [ready, loadReport]);

  const parsed = useMemo(
    () => parseReportSections(report?.contentText, report?.title || t("viewReport")),
    [report, t],
  );

  async function openBankTransfer() {
    setError("");
    setInfo("");
    setShowBankForm(true);
    try {
      const list = await apiRequest<
        Array<{
          id: string;
          bankName: string;
          accountHolder: string;
          accountNumber: string;
          branch: string | null;
        }>
      >("/bank-accounts");
      setBanks(list);
      if (list[0]) setBankAccountId(list[0].id);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not load bank accounts");
    }
  }

  async function payPayHere() {
    if (!token) return;
    setBusy(true);
    setError("");
    setInfo("");
    setShowBankForm(false);
    try {
      const result = await apiRequest<CheckoutResult>(`/orders/${params.id}/payments`, {
        token,
        body: { method: "PAYHERE" },
      });
      setOrder(result.order);
      if (result.checkout?.type === "payhere") {
        submitPayHereForm(result.checkout);
        return;
      }
      if (result.checkout?.type === "payhere_unconfigured") {
        setInfo(result.checkout.message ?? "PayHere not configured");
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Payment failed");
    } finally {
      setBusy(false);
    }
  }

  async function submitBankTransfer() {
    if (!token || !slipFile) {
      setError("Attach your bank slip");
      return;
    }
    if (!bankAccountId) {
      setError("Select the bank account you paid to");
      return;
    }
    if (!providerRef.trim()) {
      setError("Enter your bank transfer reference number");
      return;
    }
    setBusy(true);
    setError("");
    setInfo("");
    try {
      const slipBase64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = String(reader.result || "");
          const b64 = result.includes(",") ? result.split(",")[1] : result;
          resolve(b64 || "");
        };
        reader.onerror = () => reject(new Error("Could not read slip file"));
        reader.readAsDataURL(slipFile);
      });

      const result = await apiRequest<CheckoutResult>(`/orders/${params.id}/payments`, {
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
      setOrder(result.order);
      setInfo("Bank transfer submitted. We will confirm after verifying your slip.");
      setShowBankForm(false);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Payment failed");
    } finally {
      setBusy(false);
    }
  }

  async function download() {
    if (!token || !order) return;
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000/api/v1"}/orders/${order.id}/report/file`,
      { headers: { Authorization: `Bearer ${token}` } },
    );
    if (!res.ok) {
      setError("Report not ready");
      return;
    }
    const blob = await res.blob();
    const isPdf = blob.type.includes("pdf");
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${order.orderNumber}${isPdf ? ".pdf" : ".txt"}`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (!order) {
    return <div className="mx-auto max-w-3xl px-4 py-16 text-muted">Loading…</div>;
  }

  const chartSvgUrl = order.reports.find((r) => r.status === "READY")?.chartSvgUrl;
  const needsPay =
    order.status === "AWAITING_PAYMENT" || order.status === "PAYMENT_UNDER_REVIEW";

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 md:py-12">
      <Link href="/orders" className="text-sm text-muted hover:text-accent">
        ← {t("orders")}
      </Link>
      <Card className="mt-4 fade-up">
        <h1 className="font-heading text-2xl text-accent">{productName(order.product, order.language)}</h1>
        <p className="text-sm text-muted">
          {order.orderNumber} · {order.birthProfile.fullName}
        </p>
        <p className="mt-1 text-sm text-muted">
          {t("reportLanguage")}:{" "}
          {order.language === "si"
            ? t("langSi")
            : order.language === "ta"
              ? t("langTa")
              : t("langEn")}
        </p>
        <p className="mt-2 font-heading text-xl text-ink">
          {order.currency} {order.totalAmount.toLocaleString()}
        </p>
        {order.discountAmount > 0 ? (
          <p className="text-sm text-accent">
            {t("discount")}: −{order.currency} {order.discountAmount.toLocaleString()}
            {order.promoCode ? ` (${order.promoCode})` : ""}
          </p>
        ) : null}

        <div className="mt-6 flex flex-wrap gap-2">
          {STEPS.map((step) => {
            const active = order.status === step || (step === "COMPLETED" && ready);
            const passed =
              STEPS.indexOf(step) <=
              Math.max(
                STEPS.indexOf(order.status as (typeof STEPS)[number]),
                order.status === "COMPLETED" ? STEPS.length : -1,
              );
            return (
              <span
                key={step}
                className={`rounded-full border px-3 py-1 text-xs ${
                  active || passed ? "border-accent text-accent" : "border-line text-muted"
                }`}
              >
                {step.replaceAll("_", " ")}
              </span>
            );
          })}
        </div>

        {order.status === "GENERATING" || order.status === "PAID" ? (
          <p className="mt-6 text-sm text-accent">{t("generating")}</p>
        ) : null}

        {ready ? (
          <div className="mt-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-accent">{t("reportReady")}</p>
              <div className="flex flex-wrap gap-2">
                <Button onClick={() => void download()}>{t("downloadPdf")}</Button>
                <Button variant="ghost" onClick={() => void loadReport()}>
                  {t("readOnline")}
                </Button>
              </div>
            </div>

            {chartSvgUrl && token ? (
              <div className="overflow-hidden rounded-xl border border-line p-3">
                <p className="mb-2 text-sm text-muted">{t("kundaliChart")}</p>
                <KundaliPreview token={token} chartSvgUrl={chartSvgUrl} />
              </div>
            ) : null}

            <div className="rounded-xl border border-line bg-[color-mix(in_srgb,var(--bg-card)_88%,transparent)] p-4 md:p-6">
              <h2 className="font-heading text-xl text-ink">{parsed.title || t("viewReport")}</h2>
              {reportLoading ? (
                <p className="mt-3 text-sm text-muted">{t("reportLoading")}</p>
              ) : parsed.sections.length === 0 ? (
                <p className="mt-3 text-sm text-muted">{t("reportEmpty")}</p>
              ) : (
                <div className="mt-5 space-y-6">
                  {parsed.sections.map((section) => (
                    <section key={section.heading} className="space-y-2">
                      <h3 className="font-heading text-lg text-accent">{section.heading}</h3>
                      <div className="whitespace-pre-wrap text-[15px] leading-relaxed text-ink">
                        {section.body}
                      </div>
                    </section>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : null}

        {needsPay ? (
          <div className="mt-8 space-y-3 border-t border-line pt-6">
            <h2 className="font-heading text-lg text-ink">{t("checkout")}</h2>
            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
              <Button disabled={busy} onClick={() => void payPayHere()}>
                {t("payPayHere")}
              </Button>
              <Button variant="ghost" disabled={busy} onClick={() => void openBankTransfer()}>
                {t("payBank")}
              </Button>
            </div>

            {showBankForm ? (
              <div className="mt-4 space-y-4 rounded-xl border border-line p-4">
                <p className="text-sm text-muted">
                  Transfer <strong className="text-ink">{order.currency} {order.totalAmount.toLocaleString()}</strong>{" "}
                  to one of these accounts, then submit your reference and slip.
                </p>
                <div className="space-y-3">
                  {banks.map((bank) => (
                    <label
                      key={bank.id}
                      className={`block cursor-pointer rounded-xl border px-3 py-3 text-sm ${
                        bankAccountId === bank.id ? "border-accent" : "border-line"
                      }`}
                    >
                      <input
                        type="radio"
                        name="bankAccount"
                        className="mr-2 accent-[var(--accent)]"
                        checked={bankAccountId === bank.id}
                        onChange={() => setBankAccountId(bank.id)}
                      />
                      <span className="font-heading text-accent">{bank.bankName}</span>
                      <span className="mt-1 block text-ink">{bank.accountHolder}</span>
                      <span className="block text-muted">
                        {bank.accountNumber}
                        {bank.branch ? ` · ${bank.branch}` : ""}
                      </span>
                    </label>
                  ))}
                  {banks.length === 0 ? (
                    <p className="text-sm text-[var(--danger)]">No bank accounts configured yet.</p>
                  ) : null}
                </div>
                <Field
                  label="Bank transfer reference number"
                  name="providerRef"
                  value={providerRef}
                  onChange={(e) => setProviderRef(e.target.value)}
                  placeholder="e.g. FT25207XXXX"
                />
                <label className="block text-sm text-muted">
                  Attach bank slip (PDF / JPG / PNG)
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png,.webp,application/pdf,image/*"
                    className="mt-1 block w-full text-sm text-ink"
                    onChange={(e) => setSlipFile(e.target.files?.[0] ?? null)}
                  />
                </label>
                <Button disabled={busy} onClick={() => void submitBankTransfer()}>
                  {busy ? t("saving") : "Submit bank transfer"}
                </Button>
              </div>
            ) : null}

            {info ? <p className="text-sm text-muted">{info}</p> : null}
            <p className="text-xs text-muted">{t("paymentAwaitingReview")}</p>
          </div>
        ) : null}

        {error ? <p className="mt-4 text-sm text-[var(--danger)]">{error}</p> : null}
      </Card>
    </div>
  );
}

export default function OrderDetailPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-3xl px-4 py-16 text-muted">Loading…</div>}>
      <OrderDetailInner />
    </Suspense>
  );
}
