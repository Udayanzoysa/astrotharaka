"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { apiRequest } from "@/lib/api";
import { AdminStatusBadge } from "@/components/admin/admin-status-badge";
import { ORDER_ADMIN_ROLES, useAdminAccess } from "@/components/admin/use-admin-access";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatBirthTime } from "@/lib/birth-datetime";

type OrderDetail = {
  id: string;
  orderNumber: string;
  status: string;
  language: string;
  currency: string;
  promoCode: string | null;
  productPriceAmount: number;
  discountAmount: number;
  taxAmount: number;
  totalAmount: number;
  createdAt: string;
  paidAt: string | null;
  completedAt: string | null;
  hasReadyReport?: boolean;
  user: {
    id: string;
    email: string;
    role: string;
    status: string;
    profile?: { fullName: string; mobileNumber: string | null } | null;
  };
  product: { id: string; slug: string; nameEn: string };
  birthProfile: {
    id: string;
    fullName: string;
    birthPlaceName: string;
    birthDate?: string;
    birthTime?: string | null;
    unknownBirthTime?: boolean;
    timezone?: string;
  };
  payments: Array<{
    id: string;
    method: string;
    status: string;
    amount: number;
    currency: string;
    providerRef: string | null;
    bankSlipUrl: string | null;
    slipDownloadPath?: string | null;
    bankAccount?: {
      bankName: string;
      accountHolder: string;
      accountNumber: string;
      branch: string | null;
    } | null;
    createdAt: string;
    confirmedAt: string | null;
  }>;
  reports: Array<{
    id: string;
    version: number;
    status: string;
    title?: string | null;
    readyAt: string | null;
    errorMessage: string | null;
  }>;
};

export default function AdminOrderDetailPage() {
  const params = useParams<{ id: string }>();
  const { token, loading, denied, allowed } = useAdminAccess({ roles: ORDER_ADMIN_ROLES });
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [busy, setBusy] = useState(false);

  async function load() {
    if (!token) return;
    try {
      const data = await apiRequest<OrderDetail>(`/admin/orders/${params.id}`, { token });
      setOrder(data);
    } catch {
      setError("Order not found");
    }
  }

  useEffect(() => {
    if (!allowed || !token) return;
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allowed, token, params.id]);

  async function patchStatus(status: string) {
    if (!token || !order) return;
    setBusy(true);
    setActionError("");
    try {
      const data = await apiRequest<OrderDetail>(`/admin/orders/${order.id}/status`, {
        method: "PATCH",
        token,
        body: { status },
      });
      setOrder(data);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Update failed");
    } finally {
      setBusy(false);
    }
  }

  async function openSlip(path: string) {
    if (!token) return;
    const apiBase = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000/api/v1";
    const res = await fetch(`${apiBase}${path}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      setActionError("Could not open bank slip");
      return;
    }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank", "noopener,noreferrer");
  }

  if (loading) return <p className="text-muted">Loading…</p>;
  if (denied) return <p className="text-sm text-[var(--danger)]">{denied}</p>;
  if (!allowed) return null;
  if (error) return <p className="text-sm text-[var(--danger)]">{error}</p>;
  if (!order) return <p className="text-muted">Loading order…</p>;

  const canConfirm =
    order.status === "PAYMENT_UNDER_REVIEW" || order.status === "AWAITING_PAYMENT";
  const canCancel = ![
    "COMPLETED",
    "REFUNDED",
    "GENERATING",
    "CANCELLED",
  ].includes(order.status);
  const canViewReport =
    order.hasReadyReport || order.reports.some((r) => r.status === "READY");

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <Link href="/admin/orders" className="text-sm text-muted hover:text-accent">
        ← Orders
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-heading text-2xl text-ink">{order.orderNumber}</h2>
          <p className="mt-1 text-sm text-muted">
            {new Date(order.createdAt).toLocaleString()} · {order.language.toUpperCase()}
          </p>
        </div>
        <AdminStatusBadge status={order.status} />
      </div>

      {actionError ? <p className="text-sm text-[var(--danger)]">{actionError}</p> : null}

      <div className="flex flex-wrap gap-2">
        {canViewReport ? (
          <Link href={`/admin/orders/${order.id}/report`}>
            <Button>View report</Button>
          </Link>
        ) : null}
        {canConfirm ? (
          <Button disabled={busy} onClick={() => void patchStatus("PAID")}>
            Confirm payment
          </Button>
        ) : null}
        {canCancel ? (
          <Button variant="ghost" disabled={busy} onClick={() => void patchStatus("CANCELLED")}>
            Cancel order
          </Button>
        ) : null}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <h3 className="font-heading text-accent">Customer</h3>
          <p className="mt-2 text-sm text-ink">{order.user.email}</p>
          <p className="text-sm text-muted">
            {order.user.profile?.fullName ?? "—"} · {order.user.profile?.mobileNumber ?? "no mobile"}
          </p>
          <p className="mt-1 text-xs text-muted">
            {order.user.role} · {order.user.status}
          </p>
        </Card>
        <Card>
          <h3 className="font-heading text-accent">Birth profile</h3>
          <p className="mt-2 text-sm text-ink">{order.birthProfile.fullName}</p>
          <p className="text-sm text-muted">{order.birthProfile.birthPlaceName}</p>
          <p className="mt-1 text-xs text-muted">
            {order.birthProfile.birthDate
              ? new Date(order.birthProfile.birthDate).toLocaleDateString()
              : "—"}
            {order.birthProfile.unknownBirthTime
              ? " · time unknown"
              : order.birthProfile.birthTime
                ? ` · ${formatBirthTime(order.birthProfile.birthTime)}`
                : ""}
          </p>
        </Card>
      </div>

      <Card>
        <h3 className="font-heading text-accent">Product & totals</h3>
        <p className="mt-2 text-sm text-ink">
          {order.product.nameEn}{" "}
          <Link href={`/shop/${order.product.slug}`} className="text-accent hover:underline">
            ({order.product.slug})
          </Link>
        </p>
        <dl className="mt-3 grid gap-1 text-sm text-muted sm:grid-cols-2">
          <div>Product: {order.currency} {order.productPriceAmount.toLocaleString()}</div>
          <div>Discount: {order.currency} {order.discountAmount.toLocaleString()}</div>
          <div>Tax: {order.currency} {order.taxAmount.toLocaleString()}</div>
          <div className="text-ink">
            Total: {order.currency} {order.totalAmount.toLocaleString()}
          </div>
          {order.promoCode ? <div>Promo: {order.promoCode}</div> : null}
        </dl>
      </Card>

      <Card>
        <h3 className="font-heading text-accent">Payments</h3>
        <div className="mt-3 space-y-2">
          {order.payments.map((p) => (
            <div
              key={p.id}
              className="flex flex-wrap items-start justify-between gap-2 rounded-xl border border-line px-3 py-3"
            >
              <div className="min-w-0 space-y-1">
                <p className="text-sm text-ink">
                  {p.method} · {p.currency} {p.amount.toLocaleString()}
                </p>
                <p className="text-xs text-muted">{new Date(p.createdAt).toLocaleString()}</p>
                <p className="text-sm text-ink">
                  Reference: <span className="font-medium">{p.providerRef || "—"}</span>
                </p>
                {p.bankAccount ? (
                  <p className="text-xs text-muted">
                    Paid to: {p.bankAccount.bankName} · {p.bankAccount.accountNumber}
                    {p.bankAccount.branch ? ` · ${p.bankAccount.branch}` : ""}
                  </p>
                ) : null}
                {p.slipDownloadPath && token ? (
                  <button
                    type="button"
                    className="text-xs text-accent hover:underline"
                    onClick={() => void openSlip(p.slipDownloadPath!)}
                  >
                    View bank slip
                  </button>
                ) : p.bankSlipUrl ? (
                  <a
                    href={p.bankSlipUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-accent hover:underline"
                  >
                    Bank slip
                  </a>
                ) : null}
              </div>
              <AdminStatusBadge status={p.status} />
            </div>
          ))}
          {order.payments.length === 0 ? <p className="text-sm text-muted">No payments.</p> : null}
        </div>
      </Card>

      <Card>
        <h3 className="font-heading text-accent">Reports</h3>
        <div className="mt-3 space-y-2">
          {order.reports.map((r) => (
            <div
              key={r.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-line px-3 py-2"
            >
              <div>
                <p className="text-sm text-ink">
                  v{r.version} {r.title ? `· ${r.title}` : ""}
                </p>
                {r.errorMessage ? (
                  <p className="text-xs text-[var(--danger)]">{r.errorMessage}</p>
                ) : null}
              </div>
              <div className="flex items-center gap-3">
                {r.status === "READY" ? (
                  <Link
                    href={`/admin/orders/${order.id}/report`}
                    className="text-sm text-accent hover:underline"
                  >
                    View
                  </Link>
                ) : null}
                <AdminStatusBadge status={r.status} />
              </div>
            </div>
          ))}
          {order.reports.length === 0 ? <p className="text-sm text-muted">No reports yet.</p> : null}
        </div>
      </Card>
    </div>
  );
}
