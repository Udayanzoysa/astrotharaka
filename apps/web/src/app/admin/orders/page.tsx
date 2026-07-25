"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { apiRequest } from "@/lib/api";
import { AdminDataTable, type AdminTableColumn } from "@/components/admin/admin-data-table";
import { AdminStatusBadge } from "@/components/admin/admin-status-badge";
import { ORDER_ADMIN_ROLES, useAdminAccess } from "@/components/admin/use-admin-access";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field } from "@/components/ui/field";

type OrderRow = {
  id: string;
  orderNumber: string;
  status: string;
  totalAmount: number;
  currency: string;
  createdAt: string;
  hasReadyReport?: boolean;
  user: { email: string };
  product: { nameEn: string };
  birthProfile: { fullName: string };
  payments: Array<{ status: string; method: string; providerRef: string | null }>;
  reports: Array<{ status: string }>;
};

type ListResponse = {
  total: number;
  page: number;
  pageSize: number;
  items: OrderRow[];
};

const STATUSES = [
  "",
  "AWAITING_PAYMENT",
  "PAYMENT_UNDER_REVIEW",
  "PAID",
  "GENERATING",
  "COMPLETED",
  "FAILED",
  "CANCELLED",
];

const PAY_METHODS = ["", "BANK_TRANSFER", "PAYHERE"];

export default function AdminOrdersPage() {
  const { token, loading, denied, allowed } = useAdminAccess({ roles: ORDER_ADMIN_ROLES });
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [data, setData] = useState<ListResponse | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function load(nextPage = page, nextSize = pageSize) {
    if (!token) return;
    setBusy(true);
    setError("");
    try {
      const params = new URLSearchParams();
      params.set("page", String(nextPage));
      params.set("pageSize", String(nextSize));
      if (q.trim()) params.set("q", q.trim());
      if (status) params.set("status", status);
      if (paymentMethod) params.set("paymentMethod", paymentMethod);
      const res = await apiRequest<ListResponse>(`/admin/orders?${params}`, { token });
      setData(res);
      setPage(res.page);
      setPageSize(res.pageSize);
    } catch {
      setError("Failed to load orders");
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    if (!allowed || !token) return;
    void load(1, pageSize);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- initial load on access
  }, [allowed, token]);

  const columns: AdminTableColumn<OrderRow>[] = useMemo(
    () => [
      {
        id: "order",
        header: "Order",
        cell: (o) => (
          <Link href={`/admin/orders/${o.id}`} className="text-accent hover:underline">
            {o.orderNumber}
          </Link>
        ),
      },
      {
        id: "customer",
        header: "Customer",
        cell: (o) => (
          <div>
            <p className="text-ink">{o.birthProfile.fullName}</p>
            <p className="text-xs text-muted">{o.user.email}</p>
          </div>
        ),
      },
      {
        id: "product",
        header: "Product",
        cell: (o) => <span className="text-muted">{o.product.nameEn}</span>,
      },
      {
        id: "total",
        header: "Total",
        cell: (o) => (
          <span>
            {o.currency} {o.totalAmount.toLocaleString()}
          </span>
        ),
      },
      {
        id: "payment",
        header: "Payment",
        className: "text-xs text-muted",
        cell: (o) =>
          o.payments[0] ? (
            <>
              <p className="text-ink">{o.payments[0].method}</p>
              <p>{o.payments[0].providerRef || "—"}</p>
            </>
          ) : (
            "—"
          ),
      },
      {
        id: "status",
        header: "Status",
        cell: (o) => <AdminStatusBadge status={o.status} />,
      },
      {
        id: "created",
        header: "Created",
        cell: (o) => <span className="text-muted">{new Date(o.createdAt).toLocaleString()}</span>,
      },
      {
        id: "report",
        header: "Report",
        cell: (o) => {
          const ready =
            o.hasReadyReport ||
            o.reports.some((r) => r.status === "READY") ||
            o.status === "COMPLETED";
          return ready ? (
            <Link href={`/admin/orders/${o.id}/report`} className="text-sm text-accent hover:underline">
              View report
            </Link>
          ) : (
            <span className="text-xs text-muted">—</span>
          );
        },
      },
    ],
    [],
  );

  if (loading) return <p className="text-muted">Loading…</p>;
  if (denied) return <p className="text-sm text-[var(--danger)]">{denied}</p>;
  if (!allowed) return null;

  return (
    <div className="space-y-4">
      <Card>
        <form
          className="flex flex-wrap items-end gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            void load(1, pageSize);
          }}
        >
          <div className="min-w-[12rem] flex-1">
            <Field
              label="Search"
              name="q"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Order #, email, name, payment ref"
            />
          </div>
          <label className="block text-sm text-muted">
            Status
            <select
              className="mt-1 block min-h-11 w-full rounded-xl border border-line bg-[var(--input-bg)] px-3 text-ink"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              {STATUSES.map((s) => (
                <option key={s || "all"} value={s}>
                  {s || "All"}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm text-muted">
            Payment
            <select
              className="mt-1 block min-h-11 w-full rounded-xl border border-line bg-[var(--input-bg)] px-3 text-ink"
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
            >
              {PAY_METHODS.map((s) => (
                <option key={s || "all-pay"} value={s}>
                  {s || "All methods"}
                </option>
              ))}
            </select>
          </label>
          <Button type="submit" disabled={busy}>
            {busy ? "…" : "Filter"}
          </Button>
        </form>
      </Card>

      {error ? <p className="text-sm text-[var(--danger)]">{error}</p> : null}

      <AdminDataTable
        columns={columns}
        rows={data?.items ?? []}
        total={data?.total ?? 0}
        page={page}
        pageSize={pageSize}
        busy={busy}
        onPageChange={(p) => void load(p, pageSize)}
        onPageSizeChange={(size) => {
          setPageSize(size);
          void load(1, size);
        }}
        emptyMessage="No orders found."
      />
    </div>
  );
}
