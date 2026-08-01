"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { apiRequest } from "@/lib/api";
import { type SubscriptionCheckout } from "@/lib/types";
import { AdminStatusBadge } from "@/components/admin/admin-status-badge";
import { AdminDataTable, type AdminTableColumn } from "@/components/admin/admin-data-table";
import { useAdminAccess } from "@/components/admin/use-admin-access";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field } from "@/components/ui/field";

const STATUSES = ["", "AWAITING_PAYMENT", "PAYMENT_UNDER_REVIEW", "ACTIVATED", "CANCELLED"];

export default function AdminSubscriptionPaymentsPage() {
  const { token, loading, denied, allowed } = useAdminAccess({
    roles: ["CONTENT", "SUPER_ADMIN", "FINANCE"],
  });
  const [status, setStatus] = useState("PAYMENT_UNDER_REVIEW");
  const [q, setQ] = useState("");
  const [rows, setRows] = useState<SubscriptionCheckout[]>([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function load() {
    if (!token) return;
    setBusy(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (status) params.set("status", status);
      if (q.trim()) params.set("q", q.trim());
      const res = await apiRequest<SubscriptionCheckout[]>(
        `/admin/subscription-checkouts?${params}`,
        { token },
      );
      setRows(res);
    } catch {
      setError("Failed to load subscription payments");
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    if (!allowed || !token) return;
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allowed, token]);

  const columns: AdminTableColumn<SubscriptionCheckout>[] = [
    {
      id: "ref",
      header: "Checkout",
      cell: (r) => (
        <Link href={`/admin/subscription-payments/${r.id}`} className="text-accent hover:underline">
          {r.checkoutNumber}
        </Link>
      ),
    },
    {
      id: "user",
      header: "User",
      cell: (r) => (
        <div>
          <p className="text-ink">{r.userName ?? "—"}</p>
          <p className="text-xs text-muted">{r.userEmail}</p>
          {r.userMobile ? <p className="text-xs text-muted">{r.userMobile}</p> : null}
        </div>
      ),
    },
    {
      id: "package",
      header: "Package",
      cell: (r) => <span className="text-muted">{r.packageNameEn}</span>,
    },
    {
      id: "amount",
      header: "Amount",
      cell: (r) => <span>LKR {r.priceLkr.toLocaleString()}</span>,
    },
    {
      id: "status",
      header: "Status",
      cell: (r) => <AdminStatusBadge status={r.status} />,
    },
    {
      id: "created",
      header: "Created",
      cell: (r) => <span className="text-muted">{new Date(r.createdAt).toLocaleString()}</span>,
    },
    {
      id: "actions",
      header: "",
      cell: (r) =>
        r.status === "PAYMENT_UNDER_REVIEW" || r.status === "AWAITING_PAYMENT" ? (
          <Link
            href={`/admin/subscription-payments/${r.id}`}
            className="text-sm font-medium text-accent hover:underline"
          >
            Review →
          </Link>
        ) : (
          <Link href={`/admin/subscription-payments/${r.id}`} className="text-xs text-muted hover:underline">
            View
          </Link>
        ),
    },
  ];

  if (loading) return <p className="text-muted">Loading…</p>;
  if (denied) return <p className="text-sm text-[var(--danger)]">{denied}</p>;
  if (!allowed) return null;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-heading text-2xl text-ink">Subscription payments</h1>
        <p className="text-sm text-muted">Review bank slips and approve subscription activations.</p>
      </div>

      <Card>
        <form
          className="flex flex-wrap items-end gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            void load();
          }}
        >
          <div className="min-w-[12rem] flex-1">
            <Field label="Search" name="q" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <label className="block text-sm text-muted">
            Status
            <select
              className="mt-1 block min-h-11 rounded-xl border border-line bg-[var(--input-bg)] px-3 text-ink"
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
          <Button type="submit" disabled={busy}>
            Filter
          </Button>
        </form>
      </Card>

      {error ? <p className="text-sm text-[var(--danger)]">{error}</p> : null}

      <AdminDataTable
        columns={columns}
        rows={rows}
        total={rows.length}
        page={1}
        pageSize={rows.length || 20}
        busy={busy}
        onPageChange={() => {}}
        onPageSizeChange={() => {}}
        emptyMessage="No subscription checkouts found."
      />
    </div>
  );
}
