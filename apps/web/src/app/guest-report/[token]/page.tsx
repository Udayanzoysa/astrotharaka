"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ApiError, apiRequest } from "@/lib/api";
import { guestReportPath, saveGuestReport } from "@/lib/saved-reports";
import { useAuth } from "@/components/providers/auth-provider";
import { useUi } from "@/components/providers/ui-provider";
import { ReportSectionBody } from "@/components/reports/report-section-body";
import { Button } from "@/components/ui/button";
import { WarningBanner } from "@/components/ui/warning-banner";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000/api/v1";

type GuestReportStatus =
  | "QUEUED"
  | "CALCULATING"
  | "GENERATING_CONTENT"
  | "RENDERING_PDF"
  | "READY"
  | "FAILED";

type PreviewSection = {
  heading: string;
  body: string;
  locked?: boolean;
  teaser?: string | null;
};

type GuestStatusResponse = {
  id: string;
  downloadToken: string;
  status: GuestReportStatus;
  title: string | null;
  fullName?: string;
  errorMessage: string | null;
  previewSections?: PreviewSection[];
  expiresAt?: string | null;
  locked: boolean;
  fullUnlocked?: boolean;
};

export default function GuestReportViewerPage() {
  const { token: rawToken } = useParams<{ token: string }>();
  const token = decodeURIComponent(rawToken ?? "");
  const { t } = useUi();
  const { token: accessToken } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [data, setData] = useState<GuestStatusResponse | null>(null);
  const [openSections, setOpenSections] = useState<Record<number, boolean>>({});
  const [pdfDownloading, setPdfDownloading] = useState(false);
  const [sendingChannel, setSendingChannel] = useState<"email" | "whatsapp" | null>(null);
  const [sendNotice, setSendNotice] = useState("");

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    let timer: ReturnType<typeof setInterval> | null = null;

    async function load() {
      try {
        const res = await apiRequest<GuestStatusResponse>(`/guest-reports/${token}`, {
          token: accessToken,
        });
        if (cancelled) return;
        setData(res);
        setError("");
        const next = res.previewSections ?? [];
        if (res.status === "READY" && next.length > 0) {
          setOpenSections(Object.fromEntries(next.map((_, i) => [i, true])));
        }
        saveGuestReport({
          token,
          id: res.id,
          title: res.title,
          fullName: res.fullName,
          expiresAt: res.expiresAt ? new Date(res.expiresAt).getTime() : null,
        });
        if (res.status === "READY" || res.status === "FAILED") {
          if (timer) clearInterval(timer);
          timer = null;
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof ApiError ? err.message : t("guestStatusFailed"));
          setData(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    timer = setInterval(() => {
      void load();
    }, 2500);

    return () => {
      cancelled = true;
      if (timer) clearInterval(timer);
    };
  }, [token, t, accessToken]);

  async function sendToProfile(channel: "email" | "whatsapp") {
    if (!token || !unlocked) return;
    if (!accessToken) {
      setError(t("sendReportNeedLogin"));
      return;
    }
    setSendingChannel(channel);
    setSendNotice("");
    setError("");
    try {
      const res = await apiRequest<{ ok: boolean; destination: string }>(
        `/guest-reports/${token}/send`,
        {
          method: "POST",
          token: accessToken,
          body: { channel },
        },
      );
      const template = channel === "email" ? t("sendReportEmailOk") : t("sendReportWhatsappOk");
      setSendNotice(template.replace("{dest}", res.destination));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("sendReportFailed"));
    } finally {
      setSendingChannel(null);
    }
  }

  async function downloadFullPdf() {
    if (!token || !unlocked) return;
    setPdfDownloading(true);
    setError("");
    try {
      const res = await fetch(`${API_URL}/guest-reports/${token}/file`, {
        headers: {
          Accept: "application/pdf",
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
      });
      if (!res.ok) {
        let message = t("guestPdfFailed");
        try {
          const body = (await res.json()) as { message?: string | string[] };
          if (typeof body.message === "string" && body.message) message = body.message;
          else if (Array.isArray(body.message) && body.message[0]) message = body.message[0];
        } catch {
          /* keep default */
        }
        throw new Error(message);
      }
      const blob = await res.blob();
      if (!blob.size || blob.type.includes("json")) {
        throw new Error(t("guestPdfFailed"));
      }
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `tharaka-report-${data?.fullName || "horoscope"}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("guestPdfFailed"));
    } finally {
      setPdfDownloading(false);
    }
  }

  const sections = data?.previewSections ?? [];
  const ready = data?.status === "READY";
  const unlocked = data?.fullUnlocked === true;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 md:py-12">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-accent">{t("savedReports")}</p>
          <h1 className="font-heading mt-1 text-2xl text-ink">
            {data?.title || t("guestReportTitle")}
          </h1>
          {data?.fullName ? (
            <p className="mt-1 text-sm text-muted">{data.fullName}</p>
          ) : null}
        </div>
        <div className="flex gap-2">
          <Link href="/my-reports">
            <Button variant="ghost">{t("myReports")}</Button>
          </Link>
          <Link href="/#home-report">
            <Button variant="ghost">{t("guestTryAnother")}</Button>
          </Link>
        </div>
      </div>

      {loading && !data ? <p className="text-muted">{t("reportLoading")}</p> : null}
      {error ? <WarningBanner message={error} /> : null}
      {sendNotice ? (
        <p className="mt-3 rounded-xl border border-[color-mix(in_srgb,#d4af37_35%,var(--border))] bg-[color-mix(in_srgb,#d4af37_8%,transparent)] px-3 py-2 text-sm text-ink">
          {sendNotice}
        </p>
      ) : null}

      {data && data.status !== "READY" && data.status !== "FAILED" ? (
        <p className="mt-4 text-sm text-muted">{t("guestGenerating")}</p>
      ) : null}

      {data?.status === "FAILED" ? (
        <p className="mt-4 text-sm text-[var(--danger)]">
          {data.errorMessage || t("guestStatusFailed")}
        </p>
      ) : null}

      {ready && unlocked ? (
        <div className="mb-4 space-y-2">
          <Button
            fullWidth
            className="guest-glow-btn"
            disabled={pdfDownloading || Boolean(sendingChannel)}
            onClick={() => void downloadFullPdf()}
          >
            {pdfDownloading ? t("guestPdfDownloading") : t("downloadReportPdf")}
          </Button>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button
              fullWidth
              variant="ghost"
              className="sm:flex-1"
              disabled={Boolean(sendingChannel) || pdfDownloading}
              onClick={() => void sendToProfile("email")}
            >
              {sendingChannel === "email" ? t("sendReportSending") : t("sendReportEmail")}
            </Button>
            <Button
              fullWidth
              variant="ghost"
              className="sm:flex-1"
              disabled={Boolean(sendingChannel) || pdfDownloading}
              onClick={() => void sendToProfile("whatsapp")}
            >
              {sendingChannel === "whatsapp" ? t("sendReportSending") : t("sendReportWhatsapp")}
            </Button>
          </div>
        </div>
      ) : null}

      {ready && sections.length > 0 ? (
        <div className="mt-6 space-y-3">
          <p className="text-xs text-muted">
            {unlocked ? t("guestFullReportHint") : t("guestSavedHint")}
          </p>
          {sections.map((section, index) => {
            const open = Boolean(openSections[index]);
            return (
              <div
                key={`${section.heading}-${index}`}
                className="overflow-hidden rounded-2xl border border-[color-mix(in_srgb,#d4af37_28%,var(--border))]"
              >
                <button
                  type="button"
                  className="flex w-full items-center justify-between gap-2 px-4 py-3 text-left"
                  onClick={() =>
                    setOpenSections((prev) => ({ ...prev, [index]: !prev[index] }))
                  }
                >
                  <span className="font-heading text-sm text-ink sm:text-base">{section.heading}</span>
                  <span className="text-accent">{open ? "−" : "+"}</span>
                </button>
                {open ? (
                  <div className="border-t border-line/70 px-4 py-3">
                    <ReportSectionBody text={section.body} />
                    {section.locked && !unlocked ? (
                      <p className="mt-3 text-xs text-muted">{t("guestSectionLockedHint")}</p>
                    ) : null}
                  </div>
                ) : null}
              </div>
            );
          })}
          <div className="flex flex-col gap-2 pt-2 sm:flex-row">
            {unlocked ? (
              <Button
                fullWidth
                className="guest-glow-btn sm:flex-1"
                disabled={pdfDownloading}
                onClick={() => void downloadFullPdf()}
              >
                {pdfDownloading ? t("guestPdfDownloading") : t("downloadReportPdf")}
              </Button>
            ) : (
              <Link href="/shop" className="sm:flex-1">
                <Button fullWidth className="guest-glow-btn">
                  {t("guestBuyOnce")}
                </Button>
              </Link>
            )}
            <Link href={guestReportPath(token)} className="sm:flex-1">
              <Button fullWidth variant="ghost">
                {t("guestBookmarkHint")}
              </Button>
            </Link>
          </div>
        </div>
      ) : null}

      {ready && sections.length === 0 ? (
        <p className="mt-4 text-sm text-muted">{t("reportEmpty")}</p>
      ) : null}
    </div>
  );
}
