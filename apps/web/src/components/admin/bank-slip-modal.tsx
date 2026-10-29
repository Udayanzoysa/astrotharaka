"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

export type BankSlipModalProps = {
  isOpen: boolean;
  onClose: () => void;
  /** Full URL path or endpoint to fetch slip, e.g. /admin/subscription-checkouts/:id/payments/:pId/slip */
  slipUrl: string | null;
  /** Auth token for Authorization header */
  token: string | null;
  reference?: string | null;
  amount?: string | null;
};

export function BankSlipModal({
  isOpen,
  onClose,
  slipUrl,
  token,
  reference,
  amount,
}: BankSlipModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [contentType, setContentType] = useState<string>("");
  const [filename, setFilename] = useState<string>("bank-slip");

  useEffect(() => {
    if (!isOpen || !slipUrl) {
      if (blobUrl) {
        URL.revokeObjectURL(blobUrl);
        setBlobUrl(null);
      }
      setError(null);
      setLoading(false);
      return;
    }

    let active = true;
    setLoading(true);
    setError(null);

    const base = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000/api/v1";
    const fullUrl = slipUrl.startsWith("http") ? slipUrl : `${base}${slipUrl.startsWith("/") ? "" : "/"}${slipUrl}`;

    fetch(fullUrl, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then(async (res) => {
        if (!res.ok) {
          throw new Error(`Failed to load bank slip (${res.status} ${res.statusText})`);
        }

        const type = res.headers.get("content-type") || "image/jpeg";
        const disposition = res.headers.get("content-disposition") || "";
        let fname = "bank-slip";
        const match = /filename=["']?([^"';]+)["']?/.exec(disposition);
        if (match?.[1]) {
          fname = match[1];
        } else {
          const ext = type.includes("pdf") ? ".pdf" : type.includes("png") ? ".png" : ".jpg";
          fname = `bank-slip${ext}`;
        }

        const blob = await res.blob();
        if (!active) return;

        const url = URL.createObjectURL(blob);
        setBlobUrl(url);
        setContentType(type);
        setFilename(fname);
        setLoading(false);
      })
      .catch((err) => {
        if (!active) return;
        setError(err instanceof Error ? err.message : "Could not load bank slip file");
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [isOpen, slipUrl, token]);

  // Clean up blob URL on unmount
  useEffect(() => {
    return () => {
      if (blobUrl) URL.revokeObjectURL(blobUrl);
    };
  }, [blobUrl]);

  // Escape key handler
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const isPdf = contentType.includes("pdf") || filename.toLowerCase().endsWith(".pdf");

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-3 sm:p-5 backdrop-blur-sm animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative flex max-h-[92vh] w-full max-w-4xl flex-col rounded-2xl border border-line bg-[color-mix(in_srgb,var(--bg)_95%,#13213a)] shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-line px-5 py-3.5 bg-[color-mix(in_srgb,var(--bg)_85%,#13213a)]">
          <div>
            <h3 className="font-heading text-lg font-semibold text-ink">
              Bank Transfer Slip
            </h3>
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted mt-0.5">
              {reference ? <span>Reference: <strong className="text-ink">{reference}</strong></span> : null}
              {reference && amount ? <span>•</span> : null}
              {amount ? <span>Amount: <strong className="text-ink">{amount}</strong></span> : null}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-line/60 bg-[var(--input-bg)] text-muted hover:text-ink hover:border-line transition-colors text-lg"
            title="Close (Esc)"
          >
            ✕
          </button>
        </div>

        {/* Content Viewer */}
        <div className="relative flex-1 overflow-auto p-4 sm:p-6 bg-[color-mix(in_srgb,var(--bg)_70%,#000)] flex items-center justify-center min-h-[300px]">
          {loading ? (
            <div className="flex flex-col items-center gap-3 text-muted">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
              <p className="text-sm">Loading bank slip...</p>
            </div>
          ) : error ? (
            <div className="rounded-xl border border-[var(--danger)]/30 bg-[var(--danger)]/10 p-4 text-center">
              <p className="text-sm text-[var(--danger)] font-medium">{error}</p>
              <p className="text-xs text-muted mt-1">Please ensure the slip file exists on the server.</p>
            </div>
          ) : blobUrl ? (
            isPdf ? (
              <iframe
                src={blobUrl}
                title="Bank slip PDF viewer"
                className="h-[68vh] w-full rounded-xl border border-line bg-white shadow-inner"
              />
            ) : (
              <div className="flex max-h-[72vh] w-full items-center justify-center overflow-auto">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={blobUrl}
                  alt="Bank transfer slip"
                  className="max-h-[70vh] w-auto max-w-full rounded-xl object-contain shadow-2xl border border-line/40"
                />
              </div>
            )
          ) : null}
        </div>

        {/* Footer Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-5 py-3.5 bg-[color-mix(in_srgb,var(--bg)_90%,#13213a)]">
          <div className="text-xs text-muted truncate max-w-xs">
            {filename}
          </div>

          <div className="flex items-center gap-2">
            {blobUrl ? (
              <>
                <a
                  href={blobUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-9 items-center gap-1.5 rounded-xl border border-line bg-[var(--input-bg)] px-3 text-xs font-medium text-ink hover:border-accent/50 transition-colors"
                >
                  <span>↗</span> Open in new tab
                </a>
                <a
                  href={blobUrl}
                  download={filename}
                  className="inline-flex min-h-9 items-center gap-1.5 rounded-xl bg-accent px-4 text-xs font-semibold text-black hover:opacity-90 shadow-md transition-opacity"
                >
                  <span>📥</span> Download slip
                </a>
              </>
            ) : null}
            <Button
              variant="ghost"
              className="min-h-9 px-4 text-xs"
              onClick={onClose}
            >
              Close
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
