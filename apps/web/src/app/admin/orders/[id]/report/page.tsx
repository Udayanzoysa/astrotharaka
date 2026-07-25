"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { apiRequest } from "@/lib/api";
import { AdminStatusBadge } from "@/components/admin/admin-status-badge";
import { ORDER_ADMIN_ROLES, useAdminAccess } from "@/components/admin/use-admin-access";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type AdminReportView = {
  orderId: string;
  orderNumber: string;
  reportId: string;
  version: number;
  title: string | null;
  status: string;
  downloadUrl: string;
  chartSvgUrl: string;
  contentText: string | null;
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

export default function AdminOrderReportPage() {
  const params = useParams<{ id: string }>();
  const { token, loading, denied, allowed } = useAdminAccess({ roles: ORDER_ADMIN_ROLES });
  const [report, setReport] = useState<AdminReportView | null>(null);
  const [error, setError] = useState("");
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    if (!allowed || !token) return;
    void (async () => {
      try {
        const data = await apiRequest<AdminReportView>(`/admin/orders/${params.id}/report`, {
          token,
        });
        setReport(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Report not available");
      }
    })();
  }, [allowed, token, params.id]);

  const parsed = useMemo(
    () => parseReportSections(report?.contentText, report?.title || "Report"),
    [report],
  );

  async function download() {
    if (!token || !report) return;
    setDownloading(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000/api/v1"}/admin/orders/${report.orderId}/report/file`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      if (!res.ok) throw new Error("Download failed");
      const blob = await res.blob();
      const isPdf = (res.headers.get("Content-Type") ?? "").includes("pdf");
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `${report.orderNumber}${isPdf ? ".pdf" : ".txt"}`;
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

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <Link href={`/admin/orders/${params.id}`} className="text-sm text-muted hover:text-accent">
        ← Order detail
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-heading text-2xl text-ink">
            {report?.orderNumber ?? "Report"}
          </h2>
          <p className="mt-1 text-sm text-muted">
            {report ? `v${report.version} · ${report.title ?? "Generated report"}` : "Loading…"}
          </p>
        </div>
        {report ? <AdminStatusBadge status={report.status} /> : null}
      </div>

      {error ? <p className="text-sm text-[var(--danger)]">{error}</p> : null}

      {report ? (
        <>
          <div className="flex flex-wrap gap-2">
            <Button disabled={downloading} onClick={() => void download()}>
              {downloading ? "Downloading…" : "Download PDF"}
            </Button>
            <Link href={`/admin/orders/${params.id}`}>
              <Button variant="ghost">Order details</Button>
            </Link>
          </div>

          <Card>
            <h3 className="font-heading text-accent">Kundali</h3>
            <div className="mt-3">
              {token ? <KundaliPreview token={token} chartSvgUrl={report.chartSvgUrl} /> : null}
            </div>
          </Card>

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
        </>
      ) : !error ? (
        <p className="text-muted">Loading report…</p>
      ) : null}
    </div>
  );
}
