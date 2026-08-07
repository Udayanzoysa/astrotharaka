"use client";

import Link from "next/link";
import { FormEvent, useEffect, useId, useState } from "react";
import { createPortal } from "react-dom";
import { ApiError, apiRequest } from "@/lib/api";
import { readBirthDraft, writeBirthDraft } from "@/lib/birth-draft";
import { OptionalFocusTopics } from "@/components/reports/optional-focus-topics";
import { canGuestUse, consumeGuestUse, getGuestFreeLimit } from "@/lib/guest-usage";
import type { FocusTopicId } from "@/lib/focus-topics";
import { guestReportPath, saveGuestReport } from "@/lib/saved-reports";
import type { Language } from "@/lib/types";
import { useAuth } from "@/components/providers/auth-provider";
import { useUi } from "@/components/providers/ui-provider";
import { usePreviewConsumed } from "@/hooks/use-preview-consumed";
import { PackageUpgradeGate } from "@/components/subscription/package-upgrade-gate";
import {
  MemberHoroscopeFlow,
  type HoroscopeRequestBody,
} from "@/components/landing/member-horoscope-flow";
import { ReportSectionBody } from "@/components/reports/report-section-body";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
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

type GuestCreateResponse = {
  id: string;
  downloadToken: string;
  status: GuestReportStatus;
  accuracyWarning?: string | null;
  resolvedPlace?: string;
};

type GuestStatusResponse = {
  id: string;
  downloadToken: string;
  status: GuestReportStatus;
  title: string | null;
  fullName?: string;
  errorMessage: string | null;
  previewText: string;
  previewSections?: PreviewSection[];
  previewWordCount: number;
  totalWordCount: number;
  totalSections?: number;
  locked: boolean;
  isFreePreview?: boolean;
  fullUnlocked?: boolean;
  expiresAt?: string | null;
};

const SECTION_ACCENT = "#d4af37";

function statusLabel(status: GuestReportStatus, t: (key: string) => string): string {
  switch (status) {
    case "QUEUED":
      return t("guestStatusQueued");
    case "CALCULATING":
      return t("guestStatusCalculating");
    case "GENERATING_CONTENT":
      return t("guestStatusWriting");
    case "RENDERING_PDF":
      return t("guestStatusPdf");
    case "READY":
      return t("guestStatusReady");
    case "FAILED":
      return t("guestStatusFailed");
    default:
      return status;
  }
}

function statusStep(status: GuestReportStatus | null): number {
  switch (status) {
    case "QUEUED":
      return 1;
    case "CALCULATING":
      return 2;
    case "GENERATING_CONTENT":
      return 3;
    case "RENDERING_PDF":
      return 4;
    case "READY":
      return 5;
    default:
      return 1;
  }
}

type Props = {
  /** @deprecated Homepage uses the single full form; prop kept for compatibility. */
  compact?: boolean;
};

export function GuestInstantReport(_props: Props = {}) {
  const compact = true; // one consistent home-form density
  const { t, language, setLanguage } = useUi();
  const { user, token: accessToken, loading: authLoading } = useAuth();
  const previewConsumed = usePreviewConsumed();
  const titleId = useId();
  const [mounted, setMounted] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [unknownBirthTime, setUnknownBirthTime] = useState(false);
  const [focusTopics, setFocusTopics] = useState<FocusTopicId[]>([]);
  const [error, setError] = useState("");
  const [accuracyNote, setAccuracyNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [status, setStatus] = useState<GuestReportStatus | null>(null);
  const [title, setTitle] = useState<string | null>(null);
  const [guestName, setGuestName] = useState("");
  const [sections, setSections] = useState<PreviewSection[]>([]);
  const [reportLocked, setReportLocked] = useState(true);
  const [pdfDownloading, setPdfDownloading] = useState(false);
  const [sendingChannel, setSendingChannel] = useState<"email" | "whatsapp" | null>(null);
  const [sendNotice, setSendNotice] = useState("");
  const [openSections, setOpenSections] = useState<Record<number, boolean>>({ 0: true });
  const [prefillReady, setPrefillReady] = useState(false);
  const [showPackages, setShowPackages] = useState(false);
  const [gateStep, setGateStep] = useState<"packages" | "account">("packages");
  const [prefill, setPrefill] = useState({
    fullName: "",
    email: "",
    mobile: "",
    gender: "",
    birthDate: "",
    birthTime: "",
    birthPlaceName: "",
    language: language as Language,
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  // Avoid re-running when language flips from setLanguage(preferred)
  useEffect(() => {
    if (authLoading) return;
    const draft = readBirthDraft();
    const preferred = (user?.profile?.preferredLanguage ||
      draft?.language ||
      language) as Language;
    setPrefill({
      fullName: user?.profile?.fullName || draft?.fullName || "",
      email: user?.email || draft?.email || "",
      mobile: user?.profile?.mobileNumber || draft?.mobileNumber || "",
      gender: user?.profile?.gender || draft?.gender || "",
      birthDate: user?.profile?.birthDate || draft?.birthDate || "",
      birthTime: user?.profile?.birthTime || draft?.birthTime || "",
      birthPlaceName: user?.profile?.birthPlaceName || draft?.birthPlaceName || "",
      language: preferred,
    });
    if (user?.profile?.unknownBirthTime || draft?.unknownBirthTime) setUnknownBirthTime(true);
    if (user?.profile?.preferredLanguage && user.profile.preferredLanguage !== language) {
      setLanguage(user.profile.preferredLanguage);
    }
    setPrefillReady(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only when auth user loads
  }, [authLoading, user]);

  function persistFromForm(form: FormData) {
    return writeBirthDraft({
      fullName: String(form.get("fullName") ?? "").trim(),
      email: String(form.get("email") ?? "").trim(),
      mobileNumber: String(form.get("mobile") ?? "").trim() || undefined,
      gender: String(form.get("gender") ?? "").trim() || undefined,
      birthDate: String(form.get("birthDate") ?? ""),
      birthTime: unknownBirthTime ? undefined : String(form.get("birthTime") ?? ""),
      unknownBirthTime,
      birthPlaceName: String(form.get("birthPlaceName") ?? "").trim(),
      language: (form.get("language") as Language) || language,
      source: "guest",
    });
  }

  useEffect(() => {
    if (!modalOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && (status === "READY" || status === "FAILED" || !token)) {
        setModalOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [modalOpen, status, token]);

  useEffect(() => {
    if (!token || !modalOpen) return;

    const pollToken = token;
    let cancelled = false;
    let timer: ReturnType<typeof setInterval> | null = null;
    const done = status === "READY" || status === "FAILED";

    async function poll() {
      try {
        const data = await apiRequest<GuestStatusResponse>(`/guest-reports/${pollToken}`, {
          token: accessToken,
        });
        if (cancelled) return;
        setStatus(data.status);
        setTitle(data.title);
        const next = data.previewSections ?? [];
        setSections(next);
        // Locked for guest free-preview; full only if created under an active plan
        setReportLocked(data.fullUnlocked === true ? false : Boolean(data.locked));
        if (data.status === "READY") {
          setOpenSections(Object.fromEntries(next.map((_, i) => [i, true])));
          saveGuestReport({
            token: pollToken,
            id: data.id,
            title: data.title,
            fullName: data.fullName ?? guestName,
            expiresAt: data.expiresAt ? new Date(data.expiresAt).getTime() : null,
          });
        }
        if (data.status === "FAILED") {
          setError(data.errorMessage || t("guestStatusFailed"));
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof ApiError ? err.message : t("guestStatusFailed"));
          setStatus("FAILED");
        }
      }
    }

    void poll();
    if (!done) {
      timer = setInterval(() => {
        void poll();
      }, 2200);
    }

    return () => {
      cancelled = true;
      if (timer) clearInterval(timer);
    };
  }, [token, status, modalOpen, t, guestName, accessToken]);

  async function startReport(body: HoroscopeRequestBody) {
    if (authLoading) return;

    if (!user && !canGuestUse("horoscope")) {
      setGateStep("packages");
      setShowPackages(true);
      return;
    }

    setSubmitting(true);
    setError("");
    setAccuracyNote("");
    setToken(null);
    setStatus(null);
    setTitle(null);
    setSections([]);
    setReportLocked(true);
    setOpenSections({ 0: true });
    setGuestName(body.fullName);
    if (!user) setModalOpen(true);

    writeBirthDraft({
      fullName: body.fullName,
      email: body.email,
      mobileNumber: body.mobile,
      gender: body.gender,
      birthDate: body.birthDate,
      birthTime: body.birthTime,
      unknownBirthTime: body.unknownBirthTime,
      birthPlaceName: body.birthPlaceName,
      language: body.language,
      source: user ? "profile" : "guest",
    });

    try {
      if (user && accessToken) {
        const sub = await apiRequest<{ id: string } | null>("/subscriptions/me", {
          token: accessToken,
        });
        if (!sub) {
          setGateStep("packages");
          setShowPackages(true);
          setSubmitting(false);
          return;
        }
        setModalOpen(true);
      }

      const created = await apiRequest<
        GuestCreateResponse & { accessMode?: string; fullUnlocked?: boolean }
      >("/guest-reports", { body, token: accessToken });
      if (created.accessMode === "FREE_PREVIEW") {
        consumeGuestUse("horoscope");
      }
      setReportLocked(created.fullUnlocked !== true);
      setToken(created.downloadToken);
      setStatus(created.status);
      if (created.accuracyWarning) setAccuracyNote(created.accuracyWarning);
      saveGuestReport({
        token: created.downloadToken,
        id: created.id,
        fullName: body.fullName,
        title: null,
      });
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.code === "LOGIN_REQUIRED" || err.code === "FREE_PREVIEW_USED") {
          setModalOpen(false);
          setGateStep("packages");
          setShowPackages(true);
          setError(err.message);
          return;
        }
        if (err.code === "SUBSCRIPTION_REQUIRED" || err.code === "QUOTA_EXCEEDED") {
          setModalOpen(false);
          setGateStep("packages");
          setShowPackages(true);
          setError(err.message);
          return;
        }
        setError(err.message);
      } else {
        setError("Request failed");
      }
      setStatus("FAILED");
      setModalOpen(true);
    } finally {
      setSubmitting(false);
    }
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    persistFromForm(form);

    const fullName = String(form.get("fullName") ?? "").trim();
    const email = String(form.get("email") ?? "").trim();
    const gender = String(form.get("gender") ?? "").trim();
    const mobileRaw = String(form.get("mobile") ?? "").trim();
    await startReport({
      fullName,
      gender,
      email,
      mobile: mobileRaw || undefined,
      birthDate: String(form.get("birthDate") ?? ""),
      birthTime: unknownBirthTime ? undefined : String(form.get("birthTime") ?? ""),
      unknownBirthTime,
      birthPlaceName: String(form.get("birthPlaceName") ?? ""),
      language: (form.get("language") as Language) || language,
      timezone: "Asia/Colombo",
      focusTopics: focusTopics.length ? focusTopics : undefined,
    });
  }

  function resetFormState() {
    setToken(null);
    setStatus(null);
    setTitle(null);
    setGuestName("");
    setSections([]);
    setOpenSections({ 0: true });
    setError("");
    setAccuracyNote("");
    setSendNotice("");
    setSendingChannel(null);
    setModalOpen(false);
  }

  function toggleSection(index: number) {
    setOpenSections((prev) => ({ ...prev, [index]: !prev[index] }));
  }

  async function sendToProfile(channel: "email" | "whatsapp") {
    if (!token || reportLocked) return;
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
    if (!token || reportLocked) return;
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
      a.download = `tharaka-report-${guestName || "horoscope"}.pdf`;
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

  const ready = status === "READY";
  const generating = modalOpen && !ready && status !== "FAILED";
  const step = statusStep(status);
  const helloText = t("guestHelloLoading").replace(
    "{name}",
    guestName || t("guestReportTitle"),
  );

  const modal =
    mounted && modalOpen
      ? createPortal(
          <div
            className="guest-modal-backdrop fixed inset-0 z-[80] flex items-end justify-center sm:items-center sm:p-3"
            role="presentation"
            onClick={(e) => {
              if (e.target === e.currentTarget && (ready || status === "FAILED")) {
                setModalOpen(false);
              }
            }}
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby={titleId}
              className="guest-modal-panel flex max-h-[98dvh] w-full max-w-5xl flex-col overflow-hidden rounded-t-3xl border border-line bg-[var(--bg)] shadow-[0_-8px_40px_rgba(0,0,0,0.35)] sm:max-h-[94vh] sm:rounded-3xl sm:shadow-2xl"
            >
              <div className="flex items-start justify-between gap-2 border-b border-line px-3.5 py-3 sm:px-5">
                <div className="flex min-w-0 items-start gap-2.5">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/brand/taraka-nav-clear.png"
                    alt="Taraka"
                    className="mt-0.5 h-9 w-9 shrink-0 object-contain sm:h-10 sm:w-10"
                  />
                  <div className="min-w-0">
                    <p className="text-[10px] uppercase tracking-[0.18em] text-accent sm:text-[11px]">
                      {t("guestPreviewLabel")}
                    </p>
                    <h2
                      id={titleId}
                      className="mt-0.5 line-clamp-2 font-heading text-base text-ink sm:text-lg"
                    >
                      {title || t("guestReportTitle")}
                    </h2>
                  </div>
                </div>
                <button
                  type="button"
                  className="min-h-10 min-w-10 shrink-0 rounded-xl border border-line text-lg text-muted hover:text-ink disabled:opacity-40"
                  aria-label={t("guestClose")}
                  onClick={() => {
                    if (generating) return;
                    setModalOpen(false);
                  }}
                  disabled={generating}
                >
                  ×
                </button>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
                {generating ? (
                  <div className="flex min-h-[52vh] flex-col items-center justify-center px-4 py-10 text-center">
                    <div
                      className="guest-star-loader relative mb-8 h-36 w-36 sm:h-40 sm:w-40"
                      aria-hidden
                    >
                      <div className="guest-star-aura" />
                      <div className="guest-star-ring" />
                      <div className="guest-star-orbit">
                        <span className="guest-star-trail" />
                        <span className="guest-star-spark" />
                      </div>
                      <div className="guest-star-core-wrap">
                        <svg className="guest-star-core" viewBox="0 0 24 24" fill="none">
                          <path
                            d="M12 2.2l2.45 6.2 6.55.4-5.05 4.35 1.75 6.35L12 15.9 6.3 19.5l1.75-6.35L3 8.8l6.55-.4L12 2.2z"
                            fill="url(#guestStarGrad)"
                            stroke="color-mix(in srgb, #f5e6a8 80%, white)"
                            strokeWidth="0.55"
                          />
                          <defs>
                            <linearGradient id="guestStarGrad" x1="4" y1="2" x2="20" y2="22">
                              <stop offset="0%" stopColor="#f8e7a0" />
                              <stop offset="55%" stopColor="var(--accent)" />
                              <stop offset="100%" stopColor="var(--accent-hover)" />
                            </linearGradient>
                          </defs>
                        </svg>
                      </div>
                    </div>
                    <p className="max-w-sm font-heading text-[15px] leading-snug text-ink sm:text-base">
                      {helloText}
                    </p>
                    <p className="mt-3 max-w-[17rem] text-[11px] text-muted sm:text-xs">
                      {status ? statusLabel(status, t) : t("guestModalWait")}
                    </p>
                    <div className="mt-7 flex w-full max-w-[15rem] gap-1.5">
                      {[1, 2, 3, 4].map((n) => (
                        <div
                          key={n}
                          className="h-1 flex-1 rounded-full transition-colors duration-500"
                          style={{
                            background:
                              step >= n
                                ? "linear-gradient(90deg, #e8c96a, var(--accent-hover))"
                                : "var(--border)",
                          }}
                        />
                      ))}
                    </div>
                  </div>
                ) : null}

                {status === "FAILED" ? (
                  <div className="space-y-4 px-4 py-10 text-center sm:px-5">
                    <p className="text-sm text-[var(--danger)]">{error || t("guestStatusFailed")}</p>
                    <Button fullWidth onClick={resetFormState}>
                      {t("guestTryAnother")}
                    </Button>
                  </div>
                ) : null}

                {ready && sections.length > 0 ? (
                  <div className="flex min-h-[42vh] flex-col gap-2.5 px-3 py-3 sm:px-4 sm:py-4">
                    {accuracyNote ? <WarningBanner message={accuracyNote} /> : null}
                    {error ? <WarningBanner message={error} /> : null}
                    {sendNotice ? (
                      <p className="rounded-xl border border-[color-mix(in_srgb,#d4af37_35%,var(--border))] bg-[color-mix(in_srgb,#d4af37_8%,transparent)] px-3 py-2 text-xs text-ink">
                        {sendNotice}
                      </p>
                    ) : null}
                    {!reportLocked ? (
                      <Button
                        fullWidth
                        className="guest-glow-btn min-h-10 text-sm"
                        disabled={pdfDownloading}
                        onClick={() => void downloadFullPdf()}
                      >
                        {pdfDownloading ? t("guestPdfDownloading") : t("downloadReportPdf")}
                      </Button>
                    ) : null}
                    <p className="px-1 text-[11px] text-muted sm:text-xs">
                      {reportLocked ? t("guestAccordionHint") : t("guestFullReportHint")}
                    </p>
                    <div className="guest-accordion space-y-2.5" role="list">
                      {sections.map((section, index) => {
                        const open = Boolean(openSections[index]);
                        const hasLockedMore = Boolean(section.locked) && reportLocked;
                        return (
                          <div
                            key={`${section.heading}-${index}`}
                            role="listitem"
                            className="guest-section-enter overflow-hidden rounded-2xl border border-[color-mix(in_srgb,#d4af37_28%,var(--border))] bg-[color-mix(in_srgb,#d4af37_4%,transparent)]"
                            style={{ animationDelay: `${Math.min(index, 8) * 50}ms` }}
                          >
                            <button
                              type="button"
                              className="flex w-full items-center gap-2 px-3.5 py-3 text-left sm:px-4"
                              style={{ borderLeft: `3px solid ${SECTION_ACCENT}` }}
                              aria-expanded={open}
                              onClick={() => toggleSection(index)}
                            >
                              <span
                                className="min-w-0 flex-1 font-heading text-[13px] leading-snug sm:text-sm"
                                style={{ color: SECTION_ACCENT }}
                              >
                                {section.heading}
                              </span>
                              {hasLockedMore ? (
                                <svg
                                  aria-hidden
                                  className="h-3.5 w-3.5 shrink-0 text-muted/80"
                                  viewBox="0 0 16 16"
                                  fill="currentColor"
                                >
                                  <path d="M8 1.5A2.5 2.5 0 0 0 5.5 4v2H5a1.5 1.5 0 0 0-1.5 1.5v5A1.5 1.5 0 0 0 5 14h6a1.5 1.5 0 0 0 1.5-1.5v-5A1.5 1.5 0 0 0 11 6h-.5V4A2.5 2.5 0 0 0 8 1.5Zm1.5 4.5h-3V4a1.5 1.5 0 1 1 3 0v2Z" />
                                </svg>
                              ) : null}
                              <span
                                className={`shrink-0 text-muted transition-transform ${open ? "rotate-180" : ""}`}
                                aria-hidden
                              >
                                ▾
                              </span>
                            </button>

                            {open ? (
                              <div className="border-t border-[color-mix(in_srgb,#d4af37_18%,var(--border))] px-3.5 pb-3.5 pt-2.5 sm:px-4 sm:pb-4">
                                <ReportSectionBody text={section.body} />
                                {hasLockedMore ? (
                                  <div className="guest-locked-panel relative mt-3 overflow-hidden rounded-xl border border-dashed border-[color-mix(in_srgb,#d4af37_45%,transparent)] px-3 py-3.5 text-center">
                                    {section.teaser ? (
                                      <p className="pointer-events-none select-none text-[11px] leading-relaxed text-muted blur-[3px]">
                                        {section.teaser}
                                      </p>
                                    ) : (
                                      <p className="pointer-events-none select-none text-[11px] leading-relaxed text-muted blur-[3px]">
                                        {t("guestLockedBlurFiller")}
                                      </p>
                                    )}
                                    <p className="mt-2.5 font-heading text-xs text-ink sm:text-sm">
                                      {t("guestSectionLockedTitle")}
                                    </p>
                                    <p className="mt-1 text-[11px] text-muted">
                                      {t("guestSectionLockedHint")}
                                    </p>
                                    <Button
                                      type="button"
                                      fullWidth
                                      className="guest-glow-btn mx-auto mt-3 block min-h-9 w-full max-w-[14rem] text-xs"
                                      onClick={() => {
                                        setGateStep("packages");
                                        setShowPackages(true);
                                      }}
                                    >
                                      {t("guestBuyOnce")}
                                    </Button>
                                  </div>
                                ) : null}
                              </div>
                            ) : null}
                          </div>
                        );
                      })}
                    </div>
                    {reportLocked ? (
                      <p className="px-1 pt-1 text-center text-[11px] text-muted">
                        {t("guestCuriosityHint")}
                      </p>
                    ) : null}
                  </div>
                ) : null}
              </div>

              {ready ? (
                <div className="sticky bottom-0 space-y-2 border-t border-line bg-[color-mix(in_srgb,var(--bg)_92%,transparent)] p-3 backdrop-blur-md sm:p-4">
                  <div className="flex flex-col gap-2 sm:flex-row">
                    {!reportLocked ? (
                      <Button
                        fullWidth
                        className="guest-glow-btn sm:flex-1"
                        disabled={pdfDownloading || Boolean(sendingChannel)}
                        onClick={() => void downloadFullPdf()}
                      >
                        {pdfDownloading ? t("guestPdfDownloading") : t("downloadReportPdf")}
                      </Button>
                    ) : null}
                    <Link href={token ? guestReportPath(token) : "/my-reports"} className="sm:flex-1">
                      <Button fullWidth variant="ghost">
                        {t("viewSavedReport")}
                      </Button>
                    </Link>
                    {reportLocked ? (
                      <Button
                        fullWidth
                        className="guest-glow-btn sm:flex-1"
                        onClick={() => {
                          setGateStep("packages");
                          setShowPackages(true);
                        }}
                      >
                        {t("guestBuyOnce")}
                      </Button>
                    ) : null}
                    <Button
                      variant="ghost"
                      fullWidth
                      className="sm:flex-1"
                      onClick={resetFormState}
                    >
                      {t("guestTryAnother")}
                    </Button>
                  </div>
                  {!reportLocked ? (
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
                        {sendingChannel === "whatsapp"
                          ? t("sendReportSending")
                          : t("sendReportWhatsapp")}
                      </Button>
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>
          </div>,
          document.body,
        )
      : null;

  const fieldClass = compact ? "min-h-10 text-sm md:min-h-11 md:text-[15px]" : "";
  const labelClass = compact ? "text-xs sm:text-sm" : "text-sm";
  const gapClass = compact ? "space-y-2 sm:space-y-2.5 md:space-y-3" : "space-y-4";
  const selectClass = compact
    ? "min-h-10 w-full rounded-xl border border-line bg-[var(--input-bg)] px-3 text-sm text-ink md:min-h-11 md:text-[15px]"
    : "min-h-11 w-full rounded-xl border border-line bg-[var(--input-bg)] px-3 text-ink";

  return (
    <div className="w-full">
      {!prefillReady || authLoading ? (
        <p className="text-sm text-muted">…</p>
      ) : user && accessToken ? (
        <>
          <MemberHoroscopeFlow
            user={user}
            accessToken={accessToken}
            submitting={submitting}
            generating={generating}
            error={!modalOpen ? error : ""}
            onGenerate={startReport}
          />
          {ready && !modalOpen ? (
            <div className="mt-3 flex flex-col gap-2">
              <Button type="button" variant="ghost" fullWidth onClick={() => setModalOpen(true)}>
                {t("guestOpenPreview")}
              </Button>
              <Link href={token ? guestReportPath(token) : "/my-reports"}>
                <Button type="button" fullWidth>
                  {t("viewSavedReport")}
                </Button>
              </Link>
            </div>
          ) : null}
        </>
      ) : (
      <form key={`guest-${prefill.email}-${prefill.fullName}-${prefill.gender}`} className={gapClass} onSubmit={onSubmit} autoComplete="off">
        <div
          className={`grid grid-cols-1 ${compact ? "gap-2 sm:grid-cols-2 sm:gap-3 md:gap-4" : "gap-4 sm:grid-cols-2"}`}
        >
          <Field
            label={t("fullName")}
            name="fullName"
            required
            autoComplete="name"
            compact={compact}
            className={fieldClass}
            defaultValue={prefill.fullName}
          />
          <label className={`block text-ink ${compact ? "space-y-1" : "space-y-1.5"}`}>
            <span className={`block text-muted ${labelClass}`}>{t("gender")}</span>
            <select name="gender" required defaultValue={prefill.gender || ""} className={selectClass}>
              <option value="" disabled>
                {t("gender")}
              </option>
              <option value="female">{t("genderFemale")}</option>
              <option value="male">{t("genderMale")}</option>
              <option value="other">{t("genderOther")}</option>
            </select>
          </label>
        </div>

        <div
          className={`grid grid-cols-1 ${compact ? "gap-2 sm:grid-cols-2 sm:gap-3 md:gap-4" : "gap-4 sm:grid-cols-2"}`}
        >
          <Field
            label={t("email")}
            name="email"
            type="email"
            required
            autoComplete="email"
            compact={compact}
            className={fieldClass}
            defaultValue={prefill.email}
          />
          <Field
            label={t("mobileOptional")}
            name="mobile"
            type="tel"
            autoComplete="tel"
            compact={compact}
            className={fieldClass}
            defaultValue={prefill.mobile}
          />
        </div>

        <div className={`grid grid-cols-2 ${compact ? "gap-2 sm:gap-3 md:gap-4" : "gap-4"}`}>
          <Field
            label={t("birthDate")}
            name="birthDate"
            type="date"
            required
            compact={compact}
            className={fieldClass}
            defaultValue={prefill.birthDate}
          />
          <Field
            label={t("birthTime")}
            name="birthTime"
            type="time"
            disabled={unknownBirthTime}
            required={!unknownBirthTime}
            compact={compact}
            className={fieldClass}
            defaultValue={prefill.birthTime}
          />
        </div>

        <label
          className={`flex items-start gap-2 text-ink ${
            compact
              ? "min-h-0 py-0.5 text-xs leading-snug sm:text-sm"
              : "min-h-11 items-center gap-3 text-sm"
          }`}
        >
          <input
            type="checkbox"
            checked={unknownBirthTime}
            onChange={(e) => setUnknownBirthTime(e.target.checked)}
            className={`mt-0.5 shrink-0 accent-[var(--accent)] ${
              compact ? "h-4 w-4" : "h-4 w-4 md:h-5 md:w-5"
            }`}
          />
          <span>{t("unknownTime")}</span>
        </label>
        {unknownBirthTime ? (
          <WarningBanner message={t("accuracyWarning")} compact={compact} />
        ) : null}

        <div
          className={`grid grid-cols-1 ${compact ? "gap-2 sm:grid-cols-2 sm:gap-3 md:gap-4" : "gap-4 sm:grid-cols-2"}`}
        >
          <Field
            label={t("birthPlace")}
            name="birthPlaceName"
            required
            autoComplete="address-level2"
            compact={compact}
            className={fieldClass}
            defaultValue={prefill.birthPlaceName}
          />
          <label className={`block text-ink ${compact ? "space-y-1" : "space-y-1.5"}`}>
            <span className={`block text-muted ${labelClass}`}>{t("reportLanguage")}</span>
            <select name="language" defaultValue={prefill.language} className={selectClass}>
              <option value="si">{t("langSi")}</option>
              <option value="en">{t("langEn")}</option>
              <option value="ta">{t("langTa")}</option>
            </select>
          </label>
        </div>

        <OptionalFocusTopics value={focusTopics} onChange={setFocusTopics} compact={compact} />

        {error && !modalOpen ? (
          <p className={`text-[var(--danger)] ${compact ? "text-xs sm:text-sm" : "text-sm"}`}>{error}</p>
        ) : null}
        <Button
          type="submit"
          fullWidth
          disabled={submitting || generating || authLoading}
          className={`${submitting || generating ? "guest-glow-btn" : ""} ${
            compact ? "mt-1 min-h-11 text-sm md:min-h-12 md:text-base" : ""
          }`}
        >
          {submitting || generating || authLoading
            ? t("guestGenerating")
            : previewConsumed
              ? t("hadahanaGenerateCta")
              : t("guestGenerateCta")}
        </Button>
        <p
          className={`text-center text-muted ${
            compact ? "text-[11px] leading-tight sm:text-xs" : "text-xs"
          }`}
        >
          {previewConsumed
            ? t("hadahanaHint")
            : t("guestFreeOnceHint").replace("{count}", String(getGuestFreeLimit()))}
        </p>
        {ready && !modalOpen ? (
          <div className="flex flex-col gap-2">
            <Button type="button" variant="ghost" fullWidth onClick={() => setModalOpen(true)}>
              {t("guestOpenPreview")}
            </Button>
            <Link href={token ? guestReportPath(token) : "/my-reports"}>
              <Button type="button" fullWidth>
                {t("viewSavedReport")}
              </Button>
            </Link>
          </div>
        ) : null}
      </form>
      )}
      {modal}
      <PackageUpgradeGate
        open={showPackages}
        onClose={() => setShowPackages(false)}
        serviceLabel={t("quotaHoroscope")}
        returnTo="/"
        initialStep={gateStep}
      />
    </div>
  );
}
