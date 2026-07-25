"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { apiRequest } from "@/lib/api";
import { AdminStatusBadge } from "@/components/admin/admin-status-badge";
import { useAdminAccess } from "@/components/admin/use-admin-access";
import { Card } from "@/components/ui/card";

type AdminStats = {
  users: { total: number; active: number; blocked: number };
  orders: { total: number; byStatus: Record<string, number>; paidLike: number };
  guestReports: { total: number; byStatus: Record<string, number> };
  revenue: { completedTotal: number; currency: string };
  recentOrders: Array<{
    id: string;
    orderNumber: string;
    status: string;
    totalAmount: number;
    currency: string;
    createdAt: string;
    userEmail: string;
    productName: string;
  }>;
  recentGuestReports: Array<{
    id: string;
    fullName: string;
    email: string;
    status: string;
    language: string;
    createdAt: string;
  }>;
};

export default function AdminDashboardPage() {
  const { token, loading, denied, allowed } = useAdminAccess();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!allowed || !token) return;
    void (async () => {
      try {
        const data = await apiRequest<AdminStats>("/admin/stats", { token });
        setStats(data);
      } catch {
        setError("Failed to load dashboard stats");
      }
    })();
  }, [allowed, token]);

  if (loading) return <p className="text-muted">Loading…</p>;
  if (denied) return <p className="text-sm text-[var(--danger)]">{denied}</p>;
  if (!allowed) return null;

  const reviewCount = stats?.orders.byStatus.PAYMENT_UNDER_REVIEW ?? 0;
  const generating = stats?.orders.byStatus.GENERATING ?? 0;
  const guestReady = stats?.guestReports.byStatus.READY ?? 0;

  return (
    <div className="space-y-6">
      {error ? <p className="text-sm text-[var(--danger)]">{error}</p> : null}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Users" value={stats?.users.total ?? "—"} hint={`${stats?.users.active ?? 0} active`} />
        <StatCard label="Orders" value={stats?.orders.total ?? "—"} hint={`${reviewCount} under review`} />
        <StatCard
          label="Revenue (completed)"
          value={
            stats
              ? `${stats.revenue.currency} ${stats.revenue.completedTotal.toLocaleString()}`
              : "—"
          }
          hint={`${generating} generating`}
        />
        <StatCard
          label="Guest reports"
          value={stats?.guestReports.total ?? "—"}
          hint={`${guestReady} ready`}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <div className="mb-3 flex items-center justify-between gap-2">
            <h2 className="font-heading text-lg text-ink">Recent orders</h2>
            <Link href="/admin/orders" className="text-sm text-accent hover:underline">
              View all
            </Link>
          </div>
          <div className="space-y-2">
            {(stats?.recentOrders ?? []).map((o) => (
              <Link
                key={o.id}
                href={`/admin/orders/${o.id}`}
                className="flex items-center justify-between gap-3 rounded-xl border border-line px-3 py-2.5 hover:border-accent/40"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm text-ink">{o.orderNumber}</p>
                  <p className="truncate text-xs text-muted">
                    {o.userEmail} · {o.productName}
                  </p>
                </div>
                <AdminStatusBadge status={o.status} />
              </Link>
            ))}
            {stats && stats.recentOrders.length === 0 ? (
              <p className="text-sm text-muted">No orders yet.</p>
            ) : null}
          </div>
        </Card>

        <Card>
          <div className="mb-3 flex items-center justify-between gap-2">
            <h2 className="font-heading text-lg text-ink">Recent guest reports</h2>
            <Link href="/admin/guest-reports" className="text-sm text-accent hover:underline">
              View all
            </Link>
          </div>
          <div className="space-y-2">
            {(stats?.recentGuestReports ?? []).map((g) => (
              <Link
                key={g.id}
                href={`/admin/guest-reports/${g.id}`}
                className="flex items-center justify-between gap-3 rounded-xl border border-line px-3 py-2.5 hover:border-accent/40"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm text-ink">{g.fullName}</p>
                  <p className="truncate text-xs text-muted">{g.email}</p>
                </div>
                <AdminStatusBadge status={g.status} />
              </Link>
            ))}
            {stats && stats.recentGuestReports.length === 0 ? (
              <p className="text-sm text-muted">No guest reports yet.</p>
            ) : null}
          </div>
        </Card>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string | number;
  hint: string;
}) {
  return (
    <Card>
      <p className="text-xs uppercase tracking-wide text-muted">{label}</p>
      <p className="mt-2 font-heading text-2xl text-accent">{value}</p>
      <p className="mt-1 text-xs text-muted">{hint}</p>
    </Card>
  );
}
