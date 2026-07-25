"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { ApiError, apiRequest } from "@/lib/api";
import type { BirthProfile, Language, User } from "@/lib/types";
import { useUi } from "@/components/providers/ui-provider";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { WarningBanner } from "@/components/ui/warning-banner";

export type HoroscopeRequestBody = {
  fullName: string;
  gender: string;
  email: string;
  mobile?: string;
  birthDate: string;
  birthTime?: string;
  unknownBirthTime: boolean;
  birthPlaceName: string;
  language: Language;
  timezone: string;
};

type Props = {
  user: User;
  accessToken: string;
  submitting: boolean;
  generating: boolean;
  error: string;
  onGenerate: (body: HoroscopeRequestBody) => Promise<void>;
};

type Recipient = "myself" | "someone" | null;
type SomeonePath = "select" | "new" | null;

function toDateInput(value: string | null | undefined): string {
  if (!value) return "";
  const m = String(value).match(/^(\d{4}-\d{2}-\d{2})/);
  return m ? m[1] : "";
}

function toTimeInput(value: string | null | undefined): string {
  if (!value) return "";
  const s = String(value);
  const iso = s.match(/T(\d{2}):(\d{2})/);
  if (iso) return `${iso[1]}:${iso[2]}`;
  const hm = s.match(/^(\d{2}):(\d{2})/);
  return hm ? `${hm[1]}:${hm[2]}` : "";
}

function profileComplete(user: User): boolean {
  const p = user.profile;
  if (!p) return false;
  return Boolean(p.fullName && p.birthDate && p.birthPlaceName && (p.unknownBirthTime || p.birthTime));
}

export function MemberHoroscopeFlow({
  user,
  accessToken,
  submitting,
  generating,
  error,
  onGenerate,
}: Props) {
  const { t, language } = useUi();
  const [recipient, setRecipient] = useState<Recipient>(null);
  const [someonePath, setSomeonePath] = useState<SomeonePath>(null);
  const [profiles, setProfiles] = useState<BirthProfile[]>([]);
  const [profilesLoading, setProfilesLoading] = useState(false);
  const [selectedProfileId, setSelectedProfileId] = useState("");
  const [reportLanguage, setReportLanguage] = useState<Language>(
    (user.profile?.preferredLanguage as Language) || language,
  );
  const [unknownBirthTime, setUnknownBirthTime] = useState(false);
  const [localError, setLocalError] = useState("");

  useEffect(() => {
    if (!accessToken || recipient !== "someone") return;
    let cancelled = false;
    setProfilesLoading(true);
    void (async () => {
      try {
        const list = await apiRequest<BirthProfile[]>("/birth-profiles", {
          token: accessToken,
        });
        if (!cancelled) {
          setProfiles(list);
          if (list[0]) setSelectedProfileId(list[0].id);
        }
      } catch {
        if (!cancelled) setProfiles([]);
      } finally {
        if (!cancelled) setProfilesLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [accessToken, recipient]);

  const busy = submitting || generating;
  const displayError = localError || error;

  function buildMyselfBody(): HoroscopeRequestBody | null {
    const p = user.profile;
    if (!p || !profileComplete(user)) return null;
    return {
      fullName: p.fullName,
      gender: p.gender || "other",
      email: user.email,
      mobile: p.mobileNumber || undefined,
      birthDate: toDateInput(p.birthDate),
      birthTime: p.unknownBirthTime ? undefined : toTimeInput(p.birthTime) || undefined,
      unknownBirthTime: Boolean(p.unknownBirthTime),
      birthPlaceName: p.birthPlaceName || "",
      language: reportLanguage,
      timezone: "Asia/Colombo",
    };
  }

  async function generateMyself() {
    setLocalError("");
    const body = buildMyselfBody();
    if (!body) {
      setLocalError(t("horoscopeProfileIncomplete"));
      return;
    }
    await onGenerate(body);
  }

  async function generateFromSelected() {
    setLocalError("");
    const bp = profiles.find((p) => p.id === selectedProfileId);
    if (!bp) {
      setLocalError(t("horoscopePickProfile"));
      return;
    }
    await onGenerate({
      fullName: bp.fullName,
      gender: "other",
      email: user.email,
      mobile: user.profile?.mobileNumber || undefined,
      birthDate: toDateInput(bp.birthDate),
      birthTime: bp.unknownBirthTime ? undefined : toTimeInput(bp.birthTime) || undefined,
      unknownBirthTime: Boolean(bp.unknownBirthTime),
      birthPlaceName: bp.birthPlaceName,
      language: reportLanguage,
      timezone: bp.timezone || "Asia/Colombo",
    });
  }

  async function onCreateAndGenerate(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!accessToken) return;
    setLocalError("");
    const form = new FormData(e.currentTarget);
    const fullName = String(form.get("fullName") ?? "").trim();
    const birthDate = String(form.get("birthDate") ?? "").trim();
    const birthTime = unknownBirthTime ? undefined : String(form.get("birthTime") ?? "").trim();
    const birthPlaceName = String(form.get("birthPlaceName") ?? "").trim();

    if (!fullName || !birthDate || !birthPlaceName || (!unknownBirthTime && !birthTime)) {
      setLocalError(t("horoscopeProfileIncomplete"));
      return;
    }

    try {
      const created = await apiRequest<BirthProfile>("/birth-profiles", {
        token: accessToken,
        body: {
          fullName,
          birthDate,
          birthTime,
          unknownBirthTime,
          birthPlaceName,
          preferredLanguage: reportLanguage,
          timezone: "Asia/Colombo",
        },
      });
      setProfiles((prev) => [created, ...prev]);
      await onGenerate({
        fullName,
        gender: "other",
        email: user.email,
        mobile: user.profile?.mobileNumber || undefined,
        birthDate,
        birthTime,
        unknownBirthTime,
        birthPlaceName,
        language: reportLanguage,
        timezone: "Asia/Colombo",
      });
    } catch (err) {
      setLocalError(err instanceof ApiError ? err.message : "Save failed");
    }
  }

  const selectClass =
    "min-h-10 w-full rounded-xl border border-line bg-[var(--input-bg)] px-3 text-sm text-ink md:min-h-11 md:text-[15px]";
  const fieldClass = "min-h-10 text-sm md:min-h-11 md:text-[15px]";

  if (!recipient) {
    return (
      <div className="space-y-3">
        <p className="text-center text-xs text-muted sm:text-sm">{t("horoscopeChooseWho")}</p>
        <div className="grid gap-2 sm:grid-cols-2 sm:gap-3">
          <Button
            type="button"
            fullWidth
            className="guest-glow-btn min-h-12"
            onClick={() => setRecipient("myself")}
          >
            {t("horoscopeForMyself")}
          </Button>
          <Button
            type="button"
            fullWidth
            variant="ghost"
            className="min-h-12"
            onClick={() => setRecipient("someone")}
          >
            {t("horoscopeForSomeone")}
          </Button>
        </div>
        {displayError ? <p className="text-xs text-[var(--danger)] sm:text-sm">{displayError}</p> : null}
      </div>
    );
  }

  if (recipient === "myself") {
    const p = user.profile;
    const ready = profileComplete(user);
    return (
      <div className="space-y-3">
        <button
          type="button"
          className="text-xs text-muted hover:text-accent"
          onClick={() => setRecipient(null)}
        >
          ← {t("horoscopeBack")}
        </button>
        <p className="text-xs text-muted sm:text-sm">{t("horoscopeMyselfHint")}</p>
        {ready && p ? (
          <div className="rounded-2xl border border-[color-mix(in_srgb,#d4af37_28%,var(--border))] bg-[color-mix(in_srgb,#d4af37_5%,transparent)] px-3.5 py-3 text-sm text-ink">
            <p className="font-heading text-base text-accent">
              {t("horoscopeUsingProfile")}: {p.fullName}
            </p>
            <ul className="mt-2 space-y-1 text-xs text-muted sm:text-sm">
              <li>
                {t("birthDate")}: {toDateInput(p.birthDate)}
                {p.unknownBirthTime
                  ? ` · ${t("unknownTime")}`
                  : p.birthTime
                    ? ` · ${toTimeInput(p.birthTime)}`
                    : ""}
              </li>
              <li>
                {t("birthPlace")}: {p.birthPlaceName}
              </li>
              {p.gender ? (
                <li>
                  {t("gender")}:{" "}
                  {p.gender === "female"
                    ? t("genderFemale")
                    : p.gender === "male"
                      ? t("genderMale")
                      : t("genderOther")}
                </li>
              ) : null}
            </ul>
          </div>
        ) : (
          <div className="space-y-2">
            <WarningBanner message={t("horoscopeProfileIncomplete")} />
            <Link href="/settings" className="inline-block text-sm text-accent hover:underline">
              {t("settings")}
            </Link>
          </div>
        )}

        <label className="block space-y-1 text-ink">
          <span className="block text-xs text-muted sm:text-sm">{t("reportLanguage")}</span>
          <select
            value={reportLanguage}
            onChange={(e) => setReportLanguage(e.target.value as Language)}
            className={selectClass}
          >
            <option value="si">{t("langSi")}</option>
            <option value="en">{t("langEn")}</option>
            <option value="ta">{t("langTa")}</option>
          </select>
        </label>

        {displayError ? <p className="text-xs text-[var(--danger)] sm:text-sm">{displayError}</p> : null}
        <Button
          type="button"
          fullWidth
          disabled={busy || !ready}
          className={busy ? "guest-glow-btn" : ""}
          onClick={() => void generateMyself()}
        >
          {busy ? t("guestGenerating") : t("hadahanaGenerateCta")}
        </Button>
      </div>
    );
  }

  // someone else
  if (!someonePath) {
    return (
      <div className="space-y-3">
        <button
          type="button"
          className="text-xs text-muted hover:text-accent"
          onClick={() => setRecipient(null)}
        >
          ← {t("horoscopeBack")}
        </button>
        <p className="text-xs text-muted sm:text-sm">{t("horoscopeSomeoneHint")}</p>
        <div className="grid gap-2 sm:grid-cols-2 sm:gap-3">
          <Button type="button" fullWidth className="min-h-12" onClick={() => setSomeonePath("select")}>
            {t("horoscopeSelectProfile")}
          </Button>
          <Button
            type="button"
            fullWidth
            variant="ghost"
            className="min-h-12"
            onClick={() => setSomeonePath("new")}
          >
            {t("horoscopeAddProfile")}
          </Button>
        </div>
        {displayError ? <p className="text-xs text-[var(--danger)] sm:text-sm">{displayError}</p> : null}
      </div>
    );
  }

  if (someonePath === "select") {
    return (
      <div className="space-y-3">
        <button
          type="button"
          className="text-xs text-muted hover:text-accent"
          onClick={() => setSomeonePath(null)}
        >
          ← {t("horoscopeBack")}
        </button>
        {profilesLoading ? <p className="text-sm text-muted">…</p> : null}
        {!profilesLoading && profiles.length === 0 ? (
          <div className="space-y-2">
            <p className="text-sm text-muted">{t("horoscopeNoProfiles")}</p>
            <Button type="button" fullWidth onClick={() => setSomeonePath("new")}>
              {t("horoscopeAddProfile")}
            </Button>
          </div>
        ) : (
          <>
            <label className="block space-y-1 text-ink">
              <span className="block text-xs text-muted sm:text-sm">{t("horoscopePickProfile")}</span>
              <select
                value={selectedProfileId}
                onChange={(e) => setSelectedProfileId(e.target.value)}
                className={selectClass}
              >
                {profiles.map((bp) => (
                  <option key={bp.id} value={bp.id}>
                    {bp.fullName} · {toDateInput(bp.birthDate)} · {bp.birthPlaceName}
                  </option>
                ))}
              </select>
            </label>
            <label className="block space-y-1 text-ink">
              <span className="block text-xs text-muted sm:text-sm">{t("reportLanguage")}</span>
              <select
                value={reportLanguage}
                onChange={(e) => setReportLanguage(e.target.value as Language)}
                className={selectClass}
              >
                <option value="si">{t("langSi")}</option>
                <option value="en">{t("langEn")}</option>
                <option value="ta">{t("langTa")}</option>
              </select>
            </label>
            {displayError ? (
              <p className="text-xs text-[var(--danger)] sm:text-sm">{displayError}</p>
            ) : null}
            <Button
              type="button"
              fullWidth
              disabled={busy || !selectedProfileId}
              className={busy ? "guest-glow-btn" : ""}
              onClick={() => void generateFromSelected()}
            >
              {busy ? t("guestGenerating") : t("hadahanaGenerateCta")}
            </Button>
          </>
        )}
      </div>
    );
  }

  // add new birth profile
  return (
    <form className="space-y-2.5 sm:space-y-3" onSubmit={onCreateAndGenerate} autoComplete="off">
      <button
        type="button"
        className="text-xs text-muted hover:text-accent"
        onClick={() => setSomeonePath(null)}
      >
        ← {t("horoscopeBack")}
      </button>
      <Field label={t("fullName")} name="fullName" required compact className={fieldClass} />
      <div className="grid grid-cols-2 gap-2 sm:gap-3">
        <Field label={t("birthDate")} name="birthDate" type="date" required compact className={fieldClass} />
        <Field
          label={t("birthTime")}
          name="birthTime"
          type="time"
          disabled={unknownBirthTime}
          required={!unknownBirthTime}
          compact
          className={fieldClass}
        />
      </div>
      <label className="flex items-start gap-2 text-xs text-ink sm:text-sm">
        <input
          type="checkbox"
          checked={unknownBirthTime}
          onChange={(e) => setUnknownBirthTime(e.target.checked)}
          className="mt-0.5 h-4 w-4 accent-[var(--accent)]"
        />
        <span>{t("unknownTime")}</span>
      </label>
      {unknownBirthTime ? <WarningBanner message={t("accuracyWarning")} compact /> : null}
      <Field label={t("birthPlace")} name="birthPlaceName" required compact className={fieldClass} />
      <label className="block space-y-1 text-ink">
        <span className="block text-xs text-muted sm:text-sm">{t("reportLanguage")}</span>
        <select
          value={reportLanguage}
          onChange={(e) => setReportLanguage(e.target.value as Language)}
          className={selectClass}
        >
          <option value="si">{t("langSi")}</option>
          <option value="en">{t("langEn")}</option>
          <option value="ta">{t("langTa")}</option>
        </select>
      </label>
      {displayError ? <p className="text-xs text-[var(--danger)] sm:text-sm">{displayError}</p> : null}
      <Button type="submit" fullWidth disabled={busy} className={busy ? "guest-glow-btn" : ""}>
        {busy ? t("guestGenerating") : t("hadahanaGenerateCta")}
      </Button>
    </form>
  );
}
