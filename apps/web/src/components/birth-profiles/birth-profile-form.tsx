"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { ApiError, apiRequest } from "@/lib/api";
import { readBirthDraft, writeBirthDraft } from "@/lib/birth-draft";
import type { BirthProfile, Language } from "@/lib/types";
import { useAuth } from "@/components/providers/auth-provider";
import { useUi } from "@/components/providers/ui-provider";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { WarningBanner } from "@/components/ui/warning-banner";

type Props = {
  mode: "create" | "edit";
  initial?: BirthProfile | null;
};

export function BirthProfileForm({ mode, initial }: Props) {
  const { token, user, loading } = useAuth();
  const { t, language } = useUi();
  const router = useRouter();
  const [unknownBirthTime, setUnknownBirthTime] = useState(initial?.unknownBirthTime ?? false);
  const [showMore, setShowMore] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [draftReady, setDraftReady] = useState(false);
  const [draftDefaults, setDraftDefaults] = useState({
    fullName: initial?.fullName ?? "",
    birthDate: initial?.birthDate ? String(initial.birthDate).slice(0, 10) : "",
    birthTime: initial?.birthTime
      ? String(initial.birthTime).slice(11, 16) || String(initial.birthTime).slice(0, 5)
      : "",
    birthPlaceName: initial?.birthPlaceName ?? "",
    latitude: initial?.latitude ?? undefined,
    longitude: initial?.longitude ?? undefined,
  });

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, user, router]);

  useEffect(() => {
    if (initial) {
      setDraftReady(true);
      return;
    }
    const saved = readBirthDraft();
    if (saved) {
      setDraftDefaults((prev) => ({
        fullName: saved.fullName || user?.profile?.fullName || prev.fullName,
        birthDate: saved.birthDate || prev.birthDate,
        birthTime: saved.birthTime || prev.birthTime,
        birthPlaceName: saved.birthPlaceName || prev.birthPlaceName,
        latitude: saved.latitude ?? prev.latitude,
        longitude: saved.longitude ?? prev.longitude,
      }));
      if (saved.unknownBirthTime) setUnknownBirthTime(true);
    }
    setDraftReady(true);
  }, [initial, user]);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!token) return;
    setSaving(true);
    setError("");
    const form = new FormData(e.currentTarget);
    const body = {
      fullName: String(form.get("fullName") ?? ""),
      birthDate: String(form.get("birthDate") ?? ""),
      birthTime: unknownBirthTime ? undefined : String(form.get("birthTime") ?? ""),
      unknownBirthTime,
      birthPlaceName: String(form.get("birthPlaceName") ?? ""),
      latitude: form.get("latitude") ? Number(form.get("latitude")) : undefined,
      longitude: form.get("longitude") ? Number(form.get("longitude")) : undefined,
      notes: String(form.get("notes") ?? "") || undefined,
      preferredLanguage: language as Language,
      timezone: "Asia/Colombo",
    };

    writeBirthDraft({
      fullName: body.fullName,
      birthDate: body.birthDate,
      birthTime: body.birthTime,
      unknownBirthTime,
      birthPlaceName: body.birthPlaceName,
      latitude: body.latitude,
      longitude: body.longitude,
      language,
      source: "profile",
    });

    try {
      if (mode === "create") {
        await apiRequest<BirthProfile>("/birth-profiles", { token, body });
      } else if (initial) {
        await apiRequest<BirthProfile>(`/birth-profiles/${initial.id}`, {
          token,
          method: "PATCH",
          body,
        });
      }
      router.push("/birth-profiles");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function onDelete() {
    if (!token || !initial) return;
    if (!window.confirm("Delete this birth profile?")) return;
    await apiRequest(`/birth-profiles/${initial.id}`, { token, method: "DELETE" });
    router.push("/birth-profiles");
  }

  if (loading || !user || !draftReady) {
    return <div className="mx-auto max-w-lg px-4 py-16 text-muted">Loading…</div>;
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-8 md:py-12">
      <Link href="/birth-profiles" className="text-sm text-muted hover:text-accent">
        ← {t("back")}
      </Link>
      <Card className="mt-4 fade-up">
        <h1 className="font-heading text-2xl text-ink">
          {mode === "create" ? t("createProfile") : t("editProfile")}
        </h1>
        <form className="mt-6 space-y-4 pb-24 md:pb-0" onSubmit={onSubmit}>
          <Field
            label={t("fullName")}
            name="fullName"
            required
            defaultValue={draftDefaults.fullName || user.profile?.fullName || ""}
          />
          <Field
            label={t("birthDate")}
            name="birthDate"
            type="date"
            required
            defaultValue={draftDefaults.birthDate}
          />
          <Field
            label={t("birthTime")}
            name="birthTime"
            type="time"
            disabled={unknownBirthTime}
            required={!unknownBirthTime}
            defaultValue={draftDefaults.birthTime}
          />
          <label className="flex min-h-11 items-center gap-3 text-sm text-ink">
            <input
              type="checkbox"
              checked={unknownBirthTime}
              onChange={(e) => setUnknownBirthTime(e.target.checked)}
              className="h-5 w-5 accent-[var(--accent)]"
            />
            {t("unknownTime")}
          </label>
          {unknownBirthTime ? <WarningBanner message={t("accuracyWarning")} /> : null}
          <Field
            label={t("birthPlace")}
            name="birthPlaceName"
            required
            defaultValue={draftDefaults.birthPlaceName}
          />

          <button
            type="button"
            className="text-sm text-accent hover:underline"
            onClick={() => setShowMore((v) => !v)}
          >
            {t("moreSettings")}
          </button>

          {showMore ? (
            <div className="space-y-4 rounded-xl border border-line p-4">
              <Field
                label={t("latitude")}
                name="latitude"
                type="number"
                step="any"
                defaultValue={draftDefaults.latitude ?? undefined}
              />
              <Field
                label={t("longitude")}
                name="longitude"
                type="number"
                step="any"
                defaultValue={draftDefaults.longitude ?? undefined}
              />
              <Field label={t("notes")} name="notes" defaultValue={initial?.notes ?? ""} />
            </div>
          ) : null}

          {error ? <p className="text-sm text-[var(--danger)]">{error}</p> : null}

          <div className="hidden flex-wrap gap-2 md:flex">
            <Button type="submit" disabled={saving}>
              {saving ? t("saving") : t("save")}
            </Button>
            {mode === "edit" ? (
              <Button type="button" variant="ghost" onClick={() => void onDelete()}>
                {t("delete")}
              </Button>
            ) : null}
          </div>
        </form>
      </Card>

      <div className="fixed inset-x-0 bottom-0 z-20 flex gap-2 border-t border-[var(--nav-border)] bg-[color-mix(in_srgb,var(--bg)_88%,transparent)] p-3 backdrop-blur-md md:hidden">
        <Button
          fullWidth
          disabled={saving}
          onClick={() => {
            const form = document.querySelector("form");
            form?.requestSubmit();
          }}
        >
          {saving ? t("saving") : t("save")}
        </Button>
      </div>
    </div>
  );
}
