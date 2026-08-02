"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { apiRequest } from "@/lib/api";
import { AdminStatusBadge } from "@/components/admin/admin-status-badge";
import { USER_ADMIN_ROLES, useAdminAccess } from "@/components/admin/use-admin-access";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatBirthTime } from "@/lib/birth-datetime";

type GuestDetail = {
  id: string;
  fullName: string;
  gender: string;
  email: string;
  mobile: string | null;
  birthDate: string;
  birthTime: string | null;
  unknownBirthTime: boolean;
  birthPlaceName: string;
  latitude: number | null;
  longitude: number | null;
  timezone: string;
  language: string;
  status: string;
  title: string | null;
  contentText: string | null;
  hasPdf: boolean;
  engineVersion: string | null;
  aiModel: string | null;
  errorMessage: string | null;
  readyAt: string | null;
  expiresAt: string | null;
  createdAt: string;
  updatedAt: string;
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

export default function AdminGuestReportDetailPage() {
  const params = useParams<{ id: string }>();
  const { token, loading, denied, allowed } = useAdminAccess({ roles: USER_ADMIN_ROLES });
  const [report, setReport] = useState<GuestDetail | null>(null);
  const [error, setError] = useState("");
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    if (!allowed || !token) return;
    void (async () => {
      try {
        const data = await apiRequest<GuestDetail>(`/admin/guest-reports/${params.id}`, {
          token,
        });
        setReport(data);
      } catch {
        setError("Guest report not found");
      }
    })();
  }, [allowed, token, params.id]);

  const parsed = useMemo(
    () => parseReportSections(report?.contentText, report?.title || "Guest report"),
    [report],
  );

  async function downloadPdf() {
    if (!token || !report) return;
    setDownloading(true);
    setError("");
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000/api/v1"}/admin/guest-reports/${report.id}/file`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      if (!res.ok) throw new Error("PDF download failed");
      const blob = await res.blob();
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `guest-${report.fullName.replace(/[^\w.-]+/g, "_").slice(0, 40)}.pdf`;
      a.click();
      URL.revokeObjectURL(a.href);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Download failed");
    } finally {
      setDownloading(false);
    }
  }

  if (loading) return <p className="text-muted">Loading…</p>;
  if (denied) return <p className="text-sm text-[var(--danger)]">{denied}</p>;
  if (!allowed) return null;
  if (error && !report) return <p className="text-sm text-[var(--danger)]">{error}</p>;
  if (!report) return <p className="text-muted">Loading…</p>;

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <Link href="/admin/guest-reports" className="text-sm text-muted hover:text-accent">
        ← Guest reports
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-heading text-2xl text-ink">{report.fullName}</h2>
          <p className="mt-1 text-sm text-muted">
            {report.email}
            {report.mobile ? ` · ${report.mobile}` : ""}
          </p>
        </div>
        <AdminStatusBadge status={report.status} />
      </div>

      {error ? <p className="text-sm text-[var(--danger)]">{error}</p> : null}

      {report.status === "READY" && report.hasPdf ? (
        <Button disabled={downloading} onClick={() => void downloadPdf()}>
          {downloading ? "Downloading…" : "Download PDF"}
        </Button>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <h3 className="font-heading text-accent">Birth details</h3>
          <dl className="mt-3 space-y-1 text-sm text-muted">
            <div>Gender: {report.gender}</div>
            <div>Place: {report.birthPlaceName}</div>
            <div>Date: {new Date(report.birthDate).toLocaleDateString()}</div>
            <div>
              Time:{" "}
              {report.unknownBirthTime
                ? "Unknown"
                : formatBirthTime(report.birthTime) || "—"}
            </div>
            <div>Timezone: {report.timezone}</div>
            <div>
              Lat/Lng: {report.latitude ?? "—"}, {report.longitude ?? "—"}
            </div>
          </dl>
        </Card>
        <Card>
          <h3 className="font-heading text-accent">Generation</h3>
          <dl className="mt-3 space-y-1 text-sm text-muted">
            <div>Language: {report.language}</div>
            <div>Title: {report.title ?? "—"}</div>
            <div>PDF: {report.hasPdf ? "Yes" : "No"}</div>
            <div>Engine: {report.engineVersion ?? "—"}</div>
            <div>Model: {report.aiModel ?? "—"}</div>
            <div>Created: {new Date(report.createdAt).toLocaleString()}</div>
            <div>
              Ready: {report.readyAt ? new Date(report.readyAt).toLocaleString() : "—"}
            </div>
          </dl>
          {report.errorMessage ? (
            <p className="mt-3 text-sm text-[var(--danger)]">{report.errorMessage}</p>
          ) : null}
        </Card>
      </div>

      <Card>
        <h3 className="font-heading text-accent">{parsed.title}</h3>
        {parsed.sections.length === 0 ? (
          <p className="mt-3 text-sm text-muted">No report text available.</p>
        ) : (
          <div className="mt-4 space-y-5">
            {parsed.sections.map((section) => (
              <section key={section.heading}>
                <h4 className="font-heading text-ink">{section.heading}</h4>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-muted">
                  {section.body}
                </p>
              </section>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
