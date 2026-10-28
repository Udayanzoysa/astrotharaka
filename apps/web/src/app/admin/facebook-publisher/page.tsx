"use client";

import { useEffect, useState, useRef, useCallback, type ChangeEvent, type FormEvent } from "react";
import Image from "next/image";
import { useAdminAccess } from "@/components/admin/use-admin-access";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { WarningBanner } from "@/components/ui/warning-banner";
import type { StatusImagesSummary, StatusImageFileItem } from "@/lib/status-images-manager";

type FilterTab = "unused" | "used" | "all";

interface CronResultData {
  success?: boolean;
  status?: string;
  imageUsed?: string | null;
  error?: string;
  facebook?: {
    status?: string;
    postId?: string | null;
    postType?: string;
    imageUsed?: string | null;
  };
}

export default function AdminFacebookPublisherPage() {
  const { token, loading: authLoading, denied, allowed } = useAdminAccess({
    roles: ["CONTENT", "SUPER_ADMIN"],
  });

  const [summary, setSummary] = useState<StatusImagesSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // ZIP upload state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadMode, setUploadMode] = useState<"replace" | "append">("replace");
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Queue actions state
  const [actionLoading, setActionLoading] = useState(false);
  const [cronTesting, setCronTesting] = useState(false);
  const [cronResult, setCronResult] = useState<CronResultData | null>(null);

  // Gallery filter & modal
  const [activeTab, setActiveTab] = useState<FilterTab>("unused");
  const [previewImage, setPreviewImage] = useState<StatusImageFileItem | null>(null);

  const loadSummary = useCallback(async () => {
    if (!token) return;
    try {
      setError("");
      const res = await fetch("/api/admin/facebook-photos", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || "Failed to load Facebook publisher data");
      }
      setSummary(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load publisher data");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (allowed && token) {
      void loadSummary();
    }
  }, [allowed, token, loadSummary]);

  function handleFileSelect(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] || null;
    if (file) {
      if (!file.name.toLowerCase().endsWith(".zip")) {
        setError("Please select a valid .zip archive file.");
        setSelectedFile(null);
        return;
      }
      setSelectedFile(file);
      setError("");
    }
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0] || null;
    if (file) {
      if (!file.name.toLowerCase().endsWith(".zip")) {
        setError("Please drop a valid .zip archive file.");
        return;
      }
      setSelectedFile(file);
      setError("");
    }
  }

  async function handleZipSubmit(e: FormEvent) {
    e.preventDefault();
    if (!token || !selectedFile) return;

    setUploading(true);
    setError("");
    setSuccess("");

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("mode", uploadMode);

      const res = await fetch("/api/admin/facebook-photos", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const json = await res.json();
      if (!res.ok || !json.ok) {
        throw new Error(json.error || "ZIP upload failed");
      }

      setSuccess(json.message || "Photos uploaded and shuffled successfully!");
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      if (json.data?.summary) {
        setSummary(json.data.summary);
      } else {
        await loadSummary();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function handleQueueAction(action: "reshuffle" | "reset") {
    if (!token) return;
    setActionLoading(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch("/api/admin/facebook-photos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ action }),
      });

      const json = await res.json();
      if (!res.ok || !json.ok) {
        throw new Error(json.error || `Failed to ${action} queue`);
      }

      setSuccess(json.message);
      setSummary(json.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : `Action failed`);
    } finally {
      setActionLoading(false);
    }
  }

  async function handleTestCron(slot: "morning" | "afternoon" | "evening") {
    setCronTesting(true);
    setError("");
    setSuccess("");
    setCronResult(null);

    try {
      const res = await fetch(`/api/cron/astrology-status?slot=${slot}&secret=taraka_cron_secret_secure_key_2026`);
      const json = await res.json();
      setCronResult(json);
      if (json.success) {
        setSuccess(`Facebook status published successfully with image: "${json.imageUsed || 'Text post'}"!`);
      } else {
        setError(`Facebook post returned: ${json.facebook?.status || json.error || 'Failed'}`);
      }
      await loadSummary();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to trigger cron test");
    } finally {
      setCronTesting(false);
    }
  }

  if (authLoading || loading) return <p className="text-muted p-4">Loading Facebook publisher...</p>;
  if (denied) return <p className="text-sm text-[var(--danger)] p-4">{denied}</p>;
  if (!allowed) return null;

  const total = summary?.totalImages ?? 0;
  const remaining = summary?.remainingCount ?? 0;
  const used = summary?.usedCount ?? 0;
  const cycle = summary?.cycleCount ?? 1;

  const filteredFiles = (summary?.files ?? []).filter((f) => {
    if (activeTab === "unused") return !f.isUsed;
    if (activeTab === "used") return f.isUsed;
    return true;
  });

  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="font-heading text-2xl font-bold text-ink">Facebook Auto Publisher</h1>
            <span className="inline-flex items-center rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-xs font-semibold text-emerald-400 border border-emerald-500/30">
              One-Time Use Shuffle Active
            </span>
          </div>
          <p className="mt-1 text-sm text-muted">
            Photos are automatically shuffled and consumed one by one (without repeats) for the 3 daily posts (10:00 AM, 4:00 PM, 7:00 PM SLST).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            onClick={() => void loadSummary()}
            disabled={actionLoading || uploading}
            className="text-xs"
          >
            ↻ Refresh State
          </Button>
        </div>
      </div>

      {error ? <WarningBanner message={error} /> : null}
      {success ? (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/20 px-4 py-3 text-sm text-emerald-300">
          ✓ {success}
        </div>
      ) : null}

      {/* KPI Stats Grid */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-line/70">
          <p className="text-xs uppercase tracking-wider text-muted">Total Photo Pool</p>
          <p className="mt-2 font-heading text-3xl font-bold text-accent">{total}</p>
          <p className="mt-1 text-xs text-muted">Images extracted on disk</p>
        </Card>

        <Card className="border-line/70">
          <p className="text-xs uppercase tracking-wider text-muted">Remaining (Unused)</p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="font-heading text-3xl font-bold text-emerald-400">{remaining}</span>
            <span className="text-xs text-muted">/ {total}</span>
          </div>
          <p className="mt-1 text-xs text-emerald-400/80">Guaranteed no repeats until exhausted</p>
        </Card>

        <Card className="border-line/70">
          <p className="text-xs uppercase tracking-wider text-muted">Used in Current Cycle</p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="font-heading text-3xl font-bold text-amber-300">{used}</span>
            <span className="text-xs text-muted">posted</span>
          </div>
          <p className="mt-1 text-xs text-muted">Cycle #{cycle} in progress</p>
        </Card>

        <Card className="border-line/70">
          <p className="text-xs uppercase tracking-wider text-muted">Last Posted Image</p>
          <p className="mt-2 truncate font-mono text-sm font-semibold text-ink" title={summary?.lastPostedFile || "None yet"}>
            {summary?.lastPostedFile || "None in this cycle"}
          </p>
          <p className="mt-1 text-xs text-muted">
            {summary?.lastPostedSlot ? `Slot: ${summary.lastPostedSlot}` : "Awaiting next cron"}
            {summary?.lastPostedAt ? ` · ${new Date(summary.lastPostedAt).toLocaleTimeString()}` : ""}
          </p>
        </Card>
      </div>

      {/* Upload ZIP & Queue Management */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* ZIP Upload Card */}
        <div className="lg:col-span-7">
          <Card className="h-full border-line/70">
            <div className="mb-4">
              <h2 className="font-heading text-lg font-semibold text-ink">Upload Photo ZIP File</h2>
              <p className="mt-0.5 text-xs text-muted">
                Submit a .zip containing your photos (.jpg, .png, .webp). The system extracts and creates a brand-new shuffled queue.
              </p>
            </div>

            <form onSubmit={(e) => void handleZipSubmit(e)} className="space-y-4">
              {/* Drop Zone */}
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`relative flex min-h-[160px] cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-6 text-center transition ${
                  dragOver
                    ? "border-accent bg-[color-mix(in_srgb,var(--accent)_12%,transparent)]"
                    : "border-line/80 bg-[color-mix(in_srgb,var(--bg)_85%,#13213a)] hover:border-accent/60"
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".zip,application/zip,application/x-zip-compressed"
                  onChange={handleFileSelect}
                  className="hidden"
                />

                <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-accent/15 text-2xl text-accent">
                  📦
                </div>

                {selectedFile ? (
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-accent">{selectedFile.name}</p>
                    <p className="text-xs text-muted">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB · Ready to upload</p>
                    <p className="text-[11px] text-accent/80 hover:underline">Click to change file</p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-ink">
                      Click to choose a <span className="text-accent">.zip archive</span> or drag & drop here
                    </p>
                    <p className="text-xs text-muted">Supports WebP, JPEG, and PNG images inside the ZIP</p>
                  </div>
                )}
              </div>

              {/* Upload Mode Options */}
              <div className="rounded-xl border border-line bg-[var(--input-bg)] p-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted">Update Mode</p>
                <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:gap-6">
                  <label className="flex items-center gap-2 cursor-pointer text-sm text-ink">
                    <input
                      type="radio"
                      name="uploadMode"
                      value="replace"
                      checked={uploadMode === "replace"}
                      onChange={() => setUploadMode("replace")}
                      className="accent-[var(--accent)]"
                    />
                    <span>
                      <strong>Replace all</strong> (Clears previous photos & starts fresh)
                    </span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer text-sm text-ink">
                    <input
                      type="radio"
                      name="uploadMode"
                      value="append"
                      checked={uploadMode === "append"}
                      onChange={() => setUploadMode("append")}
                      className="accent-[var(--accent)]"
                    />
                    <span>
                      <strong>Append</strong> (Add new images to existing pool)
                    </span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end pt-1">
                <Button
                  type="submit"
                  disabled={!selectedFile || uploading}
                  className="min-w-[180px]"
                >
                  {uploading ? "Extracting & Shuffling…" : "Upload & Shuffle Photos"}
                </Button>
              </div>
            </form>
          </Card>
        </div>

        {/* Queue Actions & Cron Trigger Card */}
        <div className="lg:col-span-5">
          <Card className="h-full border-line/70 flex flex-col justify-between">
            <div className="space-y-4">
              <div>
                <h2 className="font-heading text-lg font-semibold text-ink">Queue Controls</h2>
                <p className="mt-0.5 text-xs text-muted">
                  Manage the sequence and simulate automated Facebook cron publishing.
                </p>
              </div>

              <div className="space-y-2.5 rounded-xl border border-line/80 bg-[color-mix(in_srgb,var(--bg)_85%,#13213a)] p-3.5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-ink">Reshuffle Remaining</p>
                    <p className="text-xs text-muted">Re-randomizes only the {remaining} unused photos</p>
                  </div>
                  <Button
                    variant="ghost"
                    onClick={() => void handleQueueAction("reshuffle")}
                    disabled={actionLoading || remaining <= 1}
                    className="text-xs"
                  >
                    Reshuffle
                  </Button>
                </div>

                <div className="border-t border-line/60 pt-2.5 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-ink">Reset Cycle</p>
                    <p className="text-xs text-muted">Mark all {total} photos as unused & shuffle</p>
                  </div>
                  <Button
                    variant="ghost"
                    onClick={() => void handleQueueAction("reset")}
                    disabled={actionLoading || total === 0}
                    className="text-xs text-amber-300 hover:text-amber-200"
                  >
                    Reset All
                  </Button>
                </div>
              </div>

              {/* Cron Quick Test */}
              <div className="rounded-xl border border-line/80 bg-[color-mix(in_srgb,var(--bg)_85%,#13213a)] p-3.5 space-y-2.5">
                <div>
                  <p className="text-sm font-semibold text-ink">Test Auto Publish Cron</p>
                  <p className="text-xs text-muted">
                    Triggers the Facebook post cron for a specific time slot using the next one-time photo.
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <Button
                    variant="ghost"
                    onClick={() => void handleTestCron("morning")}
                    disabled={cronTesting}
                    className="text-xs px-2"
                  >
                    10 AM Slot
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => void handleTestCron("afternoon")}
                    disabled={cronTesting}
                    className="text-xs px-2"
                  >
                    4 PM Slot
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => void handleTestCron("evening")}
                    disabled={cronTesting}
                    className="text-xs px-2"
                  >
                    7 PM Slot
                  </Button>
                </div>

                {cronTesting ? (
                  <p className="text-center text-xs text-accent animate-pulse">
                    Connecting to Facebook Graph API…
                  </p>
                ) : null}

                {cronResult ? (
                  <div className="mt-2 rounded-lg bg-black/40 p-2 text-[11px] text-muted font-mono overflow-auto max-h-24">
                    Status: {cronResult.facebook?.status || cronResult.status} | Post ID: {cronResult.facebook?.postId || "None"}
                  </div>
                ) : null}
              </div>
            </div>

            <p className="mt-4 text-[11px] text-muted">
              Scheduled cron runs automatically via Vercel / server crons daily at 10:00 AM, 4:00 PM, and 7:00 PM SLST.
            </p>
          </Card>
        </div>
      </div>

      {/* Photo Pool Gallery & Shuffled Sequence */}
      <Card className="border-line/70">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-line pb-4">
          <div>
            <h2 className="font-heading text-lg font-semibold text-ink">Photo Gallery & Queue Sequence</h2>
            <p className="text-xs text-muted">
              Showing photos in the exact order they will be consumed by the automated Facebook poster.
            </p>
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-1.5 rounded-xl border border-line bg-[var(--input-bg)] p-1">
            <button
              type="button"
              onClick={() => setActiveTab("unused")}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                activeTab === "unused"
                  ? "bg-accent font-bold text-[#0B0F19]"
                  : "text-muted hover:text-ink"
              }`}
            >
              Unused Queue ({remaining})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("used")}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                activeTab === "used"
                  ? "bg-accent font-bold text-[#0B0F19]"
                  : "text-muted hover:text-ink"
              }`}
            >
              Already Posted ({used})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("all")}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                activeTab === "all"
                  ? "bg-accent font-bold text-[#0B0F19]"
                  : "text-muted hover:text-ink"
              }`}
            >
              All Photos ({total})
            </button>
          </div>
        </div>

        {/* Gallery Grid */}
        {filteredFiles.length === 0 ? (
          <div className="py-12 text-center text-muted">
            <p className="text-sm">No photos found in this view.</p>
            {activeTab === "unused" && total > 0 ? (
              <p className="mt-1 text-xs text-amber-300">
                All photos have been used once! Click &quot;Reset Cycle&quot; or upload a new ZIP file.
              </p>
            ) : null}
          </div>
        ) : (
          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8">
            {filteredFiles.map((file) => {
              const isNext = file.queuePosition === 1;

              return (
                <div
                  key={file.fileName}
                  onClick={() => setPreviewImage(file)}
                  className={`group relative flex flex-col overflow-hidden rounded-xl border cursor-pointer transition hover:scale-[1.02] ${
                    isNext
                      ? "border-accent ring-2 ring-accent/40 bg-[color-mix(in_srgb,var(--accent)_10%,var(--bg))]"
                      : file.isUsed
                      ? "border-line/40 opacity-60 hover:opacity-100 bg-bg"
                      : "border-line hover:border-accent/60 bg-[color-mix(in_srgb,var(--bg)_92%,#13213a)]"
                  }`}
                >
                  {/* Badge */}
                  <div className="absolute left-1.5 top-1.5 z-10">
                    {file.isUsed ? (
                      <span className="rounded bg-black/75 px-1.5 py-0.5 text-[10px] font-medium text-emerald-400 backdrop-blur-sm">
                        ✓ Posted
                      </span>
                    ) : isNext ? (
                      <span className="rounded bg-accent px-1.5 py-0.5 text-[10px] font-bold text-[#0B0F19] shadow-sm">
                        ★ Next #1
                      </span>
                    ) : (
                      <span className="rounded bg-black/70 px-1.5 py-0.5 text-[10px] font-medium text-white/90 backdrop-blur-sm">
                        #{file.queuePosition}
                      </span>
                    )}
                  </div>

                  {/* Thumbnail */}
                  <div className="relative aspect-square w-full overflow-hidden bg-black/30">
                    <Image
                      src={file.url}
                      alt={file.fileName}
                      fill
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 150px"
                      className="object-cover transition duration-200 group-hover:scale-105"
                      unoptimized
                    />
                  </div>

                  {/* Metadata */}
                  <div className="p-2 leading-tight">
                    <p className="truncate font-mono text-[11px] text-ink" title={file.fileName}>
                      {file.fileName}
                    </p>
                    <p className="mt-0.5 text-[10px] text-muted">
                      {(file.sizeBytes / 1024).toFixed(0)} KB
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Modal Image Preview */}
      {previewImage ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
          onClick={() => setPreviewImage(null)}
        >
          <div
            className="relative max-h-[90vh] max-w-2xl overflow-hidden rounded-2xl border border-line bg-bg p-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between">
              <div>
                <p className="font-heading font-semibold text-ink">{previewImage.fileName}</p>
                <p className="text-xs text-muted">
                  {previewImage.isUsed ? "Already posted in this cycle" : `Queue position #${previewImage.queuePosition}`}
                  {" · "}
                  {(previewImage.sizeBytes / 1024).toFixed(1)} KB
                </p>
              </div>

              <button
                type="button"
                onClick={() => setPreviewImage(null)}
                className="rounded-lg p-1.5 text-muted hover:bg-white/10 hover:text-ink"
              >
                ✕
              </button>
            </div>

            <div className="relative aspect-square w-full max-h-[65vh] overflow-hidden rounded-xl bg-black">
              <Image
                src={previewImage.url}
                alt={previewImage.fileName}
                fill
                className="object-contain"
                unoptimized
              />
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
