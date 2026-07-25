"use client";

import { useEffect, useMemo, useState } from "react";
import { apiRequest } from "@/lib/api";
import { AdminDataTable, type AdminTableColumn } from "@/components/admin/admin-data-table";
import { USER_ADMIN_ROLES, useAdminAccess } from "@/components/admin/use-admin-access";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field } from "@/components/ui/field";

type UserRow = {
  id: string;
  email: string;
  role: string;
  status: string;
  emailVerifiedAt: string | null;
  blockedAt: string | null;
  createdAt: string;
  authMethods: string[];
  profile: {
    fullName: string;
    mobileNumber: string | null;
    whatsappNumber: string | null;
    preferredLanguage: string;
    emailMarketingConsent: boolean;
    whatsappMarketingConsent: boolean;
  } | null;
  ordersCount: number;
};

type ListResponse = {
  total: number;
  page: number;
  pageSize: number;
  items: UserRow[];
};

const ROLES = ["CUSTOMER", "SUPPORT", "FINANCE", "CONTENT", "SUPER_ADMIN"];

function authBadgeLabel(method: string) {
  if (method === "GOOGLE") return "Google";
  if (method === "FACEBOOK") return "Facebook";
  return "Email";
}

function digitsOnlyPhone(raw: string | null | undefined) {
  if (!raw) return "";
  return raw.replace(/[^\d]/g, "");
}

function whatsappUrl(phone: string, message: string) {
  const digits = digitsOnlyPhone(phone);
  if (!digits) return null;
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}

export default function AdminUsersPage() {
  const { user, token, loading, denied, allowed } = useAdminAccess({ roles: USER_ADMIN_ROLES });
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [data, setData] = useState<ListResponse | null>(null);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState("");
  const [busy, setBusy] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [promoOpen, setPromoOpen] = useState(false);
  const [promoSubject, setPromoSubject] = useState("An update from Taraka");
  const [promoMessage, setPromoMessage] = useState("");
  const [promoSegment, setPromoSegment] = useState<"selected" | "active_marketing" | "all_active">(
    "selected",
  );
  const [promoNote, setPromoNote] = useState("");

  async function load(nextPage = page, nextSize = pageSize) {
    if (!token) return;
    setBusy(true);
    setError("");
    try {
      const params = new URLSearchParams({
        page: String(nextPage),
        pageSize: String(nextSize),
      });
      if (q.trim()) params.set("q", q.trim());
      const res = await apiRequest<ListResponse>(`/admin/users?${params}`, { token });
      setData(res);
      setPage(res.page);
      setPageSize(res.pageSize);
    } catch {
      setError("Failed to load users");
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    if (!allowed || !token) return;
    void load(1, pageSize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allowed, token]);

  async function patchUser(id: string, body: { status?: string; role?: string }) {
    if (!token) return;
    setBusyId(id);
    setError("");
    try {
      const updated = await apiRequest<UserRow>(`/admin/users/${id}`, {
        method: "PATCH",
        token,
        body,
      });
      setData((prev) =>
        prev
          ? {
              ...prev,
              items: prev.items.map((u) => (u.id === id ? { ...u, ...updated } : u)),
            }
          : prev,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update failed");
    } finally {
      setBusyId("");
    }
  }

  async function bulkDeactivate(ids: string[]) {
    if (!token || !ids.length) return;
    setBusy(true);
    setError("");
    try {
      await apiRequest<{ updated: number }>("/admin/users/bulk", {
        method: "PATCH",
        token,
        body: { ids, status: "BLOCKED" },
      });
      setSelectedIds([]);
      await load(page, pageSize);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Bulk update failed");
    } finally {
      setBusy(false);
    }
  }

  async function sendEmailReport(id: string) {
    if (!token) return;
    setBusyId(id);
    setError("");
    try {
      const res = await apiRequest<{ ok: boolean; email: string }>(`/admin/users/${id}/email-report`, {
        method: "POST",
        token,
      });
      setPromoNote(`Activity report emailed to ${res.email}.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send report email");
    } finally {
      setBusyId("");
    }
  }

  async function sendPromo() {
    if (!token) return;
    setBusy(true);
    setError("");
    setPromoNote("");
    try {
      const res = await apiRequest<{ sent: number; total: number }>("/admin/users/promo-email", {
        method: "POST",
        token,
        body: {
          segment: promoSegment,
          userIds: promoSegment === "selected" ? selectedIds : undefined,
          subject: promoSubject,
          message: promoMessage,
        },
      });
      setPromoNote(`Promotional email sent to ${res.sent} of ${res.total} users.`);
      setPromoOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Promo send failed");
    } finally {
      setBusy(false);
    }
  }

  const isSuper = user?.role === "SUPER_ADMIN";

  const columns: AdminTableColumn<UserRow>[] = useMemo(
    () => [
      {
        id: "user",
        header: "User",
        cell: (u) => (
          <div>
            <p className="text-ink">{u.profile?.fullName ?? "—"}</p>
            <p className="text-xs text-muted">{u.email}</p>
            <div className="mt-1 flex flex-wrap gap-1">
              {(u.authMethods ?? ["EMAIL"]).map((m) => (
                <span
                  key={m}
                  className="rounded-md border border-line px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-muted"
                >
                  {authBadgeLabel(m)}
                </span>
              ))}
            </div>
          </div>
        ),
      },
      {
        id: "role",
        header: "Role",
        cell: (u) =>
          isSuper && u.id !== user?.id ? (
            <select
              className="rounded-lg border border-line bg-[var(--input-bg)] px-2 py-1 text-xs text-ink"
              value={u.role}
              disabled={busyId === u.id || busy}
              onChange={(e) => void patchUser(u.id, { role: e.target.value })}
            >
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          ) : (
            <span className="text-muted">{u.role}</span>
          ),
      },
      {
        id: "status",
        header: "Status",
        cell: (u) => (
          <select
            className="rounded-lg border border-line bg-[var(--input-bg)] px-2 py-1 text-xs text-ink"
            value={u.status === "BLOCKED" ? "BLOCKED" : "ACTIVE"}
            disabled={busyId === u.id || busy || u.id === user?.id}
            onChange={(e) => void patchUser(u.id, { status: e.target.value })}
          >
            <option value="ACTIVE">Active</option>
            <option value="BLOCKED">Blocked</option>
          </select>
        ),
      },
      {
        id: "orders",
        header: "Orders",
        cell: (u) => <span className="text-muted">{u.ordersCount}</span>,
      },
      {
        id: "actions",
        header: "Actions",
        cell: (u) => {
          const phone = u.profile?.whatsappNumber || u.profile?.mobileNumber || "";
          const wa = whatsappUrl(
            phone,
            `Hello ${u.profile?.fullName || "there"}, this is a message from Taraka Admin regarding your account.`,
          );
          return (
            <div className="flex flex-wrap gap-1">
              <Button
                variant="ghost"
                className="min-h-9 px-3 text-xs"
                disabled={busyId === u.id || busy}
                onClick={() => void sendEmailReport(u.id)}
              >
                Email report
              </Button>
              {wa ? (
                <a
                  href={wa}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex min-h-9 items-center rounded-xl border border-[color:var(--accent-hover)] px-3 text-xs font-semibold text-ink hover:bg-[color-mix(in_srgb,var(--accent-hover)_12%,transparent)]"
                >
                  WhatsApp
                </a>
              ) : (
                <span className="text-xs text-muted">No phone</span>
              )}
            </div>
          );
        },
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [busy, busyId, isSuper, user?.id],
  );

  if (loading) return <p className="text-muted">Loading…</p>;
  if (denied) return <p className="text-sm text-[var(--danger)]">{denied}</p>;
  if (!allowed) return null;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl text-ink">Users</h1>
          <p className="text-sm text-muted">Status controls, auth badges, and outreach actions.</p>
        </div>
        <Button type="button" variant="ghost" onClick={() => setPromoOpen((v) => !v)}>
          {promoOpen ? "Hide promo composer" : "Promotional messaging"}
        </Button>
      </div>

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
              placeholder="Email or name"
            />
          </div>
          <Button type="submit" disabled={busy}>
            Filter
          </Button>
        </form>
      </Card>

      {promoOpen ? (
        <Card>
          <div className="space-y-3">
            <h2 className="font-heading text-lg text-ink">Promotional email</h2>
            <label className="block text-sm text-muted">
              Audience
              <select
                className="mt-1 min-h-11 w-full rounded-xl border border-line bg-[var(--input-bg)] px-3 text-ink"
                value={promoSegment}
                onChange={(e) =>
                  setPromoSegment(e.target.value as "selected" | "active_marketing" | "all_active")
                }
              >
                <option value="selected">Selected rows ({selectedIds.length})</option>
                <option value="active_marketing">Active customers with email marketing consent</option>
                <option value="all_active">All active customers (max 200)</option>
              </select>
            </label>
            <Field
              label="Subject"
              name="promoSubject"
              value={promoSubject}
              onChange={(e) => setPromoSubject(e.target.value)}
            />
            <label className="block text-sm text-muted">
              Message
              <textarea
                className="mt-1 min-h-28 w-full rounded-xl border border-line bg-[var(--input-bg)] px-3 py-2 text-ink"
                value={promoMessage}
                onChange={(e) => setPromoMessage(e.target.value)}
                placeholder="Write your promotional message…"
              />
            </label>
            <div className="flex justify-end">
              <Button
                type="button"
                disabled={
                  busy ||
                  !promoSubject.trim() ||
                  !promoMessage.trim() ||
                  (promoSegment === "selected" && selectedIds.length === 0)
                }
                onClick={() => void sendPromo()}
              >
                Send promotional emails
              </Button>
            </div>
          </div>
        </Card>
      ) : null}

      {error ? <p className="text-sm text-[var(--danger)]">{error}</p> : null}
      {promoNote ? <p className="text-sm text-ink">{promoNote}</p> : null}

      <AdminDataTable
        columns={columns}
        rows={data?.items ?? []}
        total={data?.total ?? 0}
        page={page}
        pageSize={pageSize}
        busy={busy}
        selectedIds={selectedIds}
        onSelectedIdsChange={setSelectedIds}
        onPageChange={(p) => void load(p, pageSize)}
        onPageSizeChange={(size) => {
          setPageSize(size);
          void load(1, size);
        }}
        bulkActions={[
          {
            id: "deactivate",
            label: "Bulk deactivate",
            onClick: (ids) => bulkDeactivate(ids),
          },
        ]}
        emptyMessage="No users found."
      />
    </div>
  );
}
