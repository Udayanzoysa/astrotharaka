"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { apiRequest } from "@/lib/api";
import { AdminDataTable, type AdminTableColumn } from "@/components/admin/admin-data-table";
import { AdminStatusBadge } from "@/components/admin/admin-status-badge";
import { USER_ADMIN_ROLES, useAdminAccess } from "@/components/admin/use-admin-access";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field } from "@/components/ui/field";

type GuestRow = {
  id: string;
  fullName: string;
  gender: string;
  email: string;
  mobile: string | null;
  birthPlaceName: string;
  language: string;
  status: string;
  title: string | null;
  createdAt: string;
  readyAt: string | null;
  expiresAt: string | null;
};

type ListResponse = {
  total: number;
  page: number;
  pageSize: number;
  items: GuestRow[];
};

type TemplateItem = {
  id: string;
  title: string;
  description: string;
  channels: string[];
};

const STATUSES = [
  "",
  "QUEUED",
  "CALCULATING",
  "GENERATING_CONTENT",
  "RENDERING_PDF",
  "READY",
  "FAILED",
];

export default function AdminGuestReportsPage() {
  const { token, loading, denied, allowed } = useAdminAccess({ roles: USER_ADMIN_ROLES });
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [data, setData] = useState<ListResponse | null>(null);
  const [error, setError] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [templates, setTemplates] = useState<TemplateItem[]>([]);
  const [templateId, setTemplateId] = useState("account_invite");
  const [extraMessage, setExtraMessage] = useState("");

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
      if (status) params.set("status", status);
      const res = await apiRequest<ListResponse>(`/admin/guest-reports?${params}`, { token });
      setData(res);
      setPage(res.page);
      setPageSize(res.pageSize);
    } catch {
      setError("Failed to load guest reports");
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    if (!allowed || !token) return;
    void load(1, pageSize);
    void (async () => {
      try {
        const res = await apiRequest<{ items: TemplateItem[] }>(
          "/admin/guest-reports/outreach-templates",
          { token },
        );
        setTemplates(res.items);
        if (res.items[0]) setTemplateId(res.items[0].id);
      } catch {
        /* templates optional on first paint */
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allowed, token]);

  async function sendOutreach(channel: "email" | "sms", ids = selectedIds) {
    if (!token || !ids.length) return;
    setBusy(true);
    setError("");
    setNote("");
    try {
      const res = await apiRequest<{ sent: number; total: number }>("/admin/guest-reports/outreach", {
        method: "POST",
        token,
        body: {
          ids,
          templateId,
          channel,
          extraMessage: extraMessage.trim() || undefined,
        },
      });
      setNote(`${channel.toUpperCase()} outreach sent to ${res.sent} of ${res.total} guests.`);
      setSelectedIds([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Outreach failed");
    } finally {
      setBusy(false);
    }
  }

  const columns: AdminTableColumn<GuestRow>[] = useMemo(
    () => [
      {
        id: "name",
        header: "Name",
        cell: (g) => (
          <div>
            <Link href={`/admin/guest-reports/${g.id}`} className="text-accent hover:underline">
              {g.fullName}
            </Link>
            <p className="text-xs text-muted">
              {g.gender} · {g.language}
            </p>
          </div>
        ),
      },
      {
        id: "contact",
        header: "Contact",
        cell: (g) => (
          <div>
            <p className="text-ink">{g.email}</p>
            <p className="text-xs text-muted">{g.mobile ?? "—"}</p>
          </div>
        ),
      },
      {
        id: "place",
        header: "Place",
        cell: (g) => <span className="text-muted">{g.birthPlaceName}</span>,
      },
      {
        id: "status",
        header: "Status",
        cell: (g) => <AdminStatusBadge status={g.status} />,
      },
      {
        id: "created",
        header: "Created",
        cell: (g) => <span className="text-muted">{new Date(g.createdAt).toLocaleString()}</span>,
      },
      {
        id: "report",
        header: "Report",
        cell: (g) => (
          <Link href={`/admin/guest-reports/${g.id}`} className="text-sm text-accent hover:underline">
            {g.status === "READY" ? "View report" : "Open"}
          </Link>
        ),
      },
    ],
    [],
  );

  if (loading) return <p className="text-muted">Loading…</p>;
  if (denied) return <p className="text-sm text-[var(--danger)]">{denied}</p>;
  if (!allowed) return null;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-heading text-2xl text-ink">Guest reports</h1>
        <p className="text-sm text-muted">
          Manage guest leads and send template-based email or SMS outreach.
        </p>
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
              placeholder="Email, name, mobile"
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
          <Button type="submit" disabled={busy}>
            Filter
          </Button>
        </form>
      </Card>

      <Card>
        <div className="space-y-3">
          <h2 className="font-heading text-lg text-ink">Template outreach</h2>
          <div className="grid gap-3 md:grid-cols-2">
            <label className="block text-sm text-muted">
              Message template
              <select
                className="mt-1 min-h-11 w-full rounded-xl border border-line bg-[var(--input-bg)] px-3 text-ink"
                value={templateId}
                onChange={(e) => setTemplateId(e.target.value)}
              >
                {templates.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.title}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm text-muted">
              Optional custom note
              <input
                className="mt-1 min-h-11 w-full rounded-xl border border-line bg-[var(--input-bg)] px-3 text-ink"
                value={extraMessage}
                onChange={(e) => setExtraMessage(e.target.value)}
                placeholder="Add a short custom line…"
              />
            </label>
          </div>
          <p className="text-xs text-muted">
            Select guests below, then use bulk actions or send directly to the current selection.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="ghost"
              disabled={busy || selectedIds.length === 0}
              onClick={() => void sendOutreach("email")}
            >
              Send invite emails
            </Button>
            <Button
              type="button"
              variant="ghost"
              disabled={busy || selectedIds.length === 0}
              onClick={() => void sendOutreach("sms")}
            >
              Send SMS campaign
            </Button>
          </div>
        </div>
      </Card>

      {error ? <p className="text-sm text-[var(--danger)]">{error}</p> : null}
      {note ? <p className="text-sm text-ink">{note}</p> : null}

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
            id: "email",
            label: "Bulk send invites (email)",
            onClick: (ids) => sendOutreach("email", ids),
          },
          {
            id: "sms",
            label: "Bulk send SMS",
            onClick: (ids) => sendOutreach("sms", ids),
          },
        ]}
        emptyMessage="No guest reports found."
      />
    </div>
  );
}
