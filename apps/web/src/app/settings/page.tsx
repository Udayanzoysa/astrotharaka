"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ApiError, apiRequest } from "@/lib/api";
import { writeBirthDraft } from "@/lib/birth-draft";
import type { Language, User } from "@/lib/types";
import { useAuth } from "@/components/providers/auth-provider";
import { useUi } from "@/components/providers/ui-provider";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { WarningBanner } from "@/components/ui/warning-banner";

/** Normalize API date/time for HTML date/time inputs. */
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

export default function SettingsPage() {
  const { token, user, loading, refreshMe, setSession } = useAuth();
  const { t, language, setLanguage } = useUi();
  const router = useRouter();
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [birthTime, setBirthTime] = useState("");
  const [unknownBirthTime, setUnknownBirthTime] = useState(false);
  const [birthPlaceName, setBirthPlaceName] = useState("");
  const [gender, setGender] = useState("");
  const [preferredLanguage, setPreferredLanguage] = useState<Language>("si");
  const [emailConsent, setEmailConsent] = useState(false);
  const [whatsappConsent, setWhatsappConsent] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [passwordMsg, setPasswordMsg] = useState("");
  const [passwordSaving, setPasswordSaving] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, user, router]);

  useEffect(() => {
    if (!user?.profile) return;
    const p = user.profile;
    setFullName(p.fullName ?? "");
    setEmail(user.email ?? "");
    setMobileNumber(p.mobileNumber ?? "");
    setWhatsappNumber(p.whatsappNumber ?? "");
    setBirthDate(toDateInput(p.birthDate));
    setBirthTime(toTimeInput(p.birthTime));
    setUnknownBirthTime(Boolean(p.unknownBirthTime));
    setBirthPlaceName(p.birthPlaceName ?? "");
    setGender(p.gender ?? "");
    setPreferredLanguage((p.preferredLanguage as Language) || language);
    setEmailConsent(Boolean(p.emailMarketingConsent));
    setWhatsappConsent(Boolean(p.whatsappMarketingConsent));
  }, [user, language]);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!token) return;
    setSaving(true);
    setError("");
    setSaved(false);

    const nextBirthDate = birthDate.trim() || null;
    const nextBirthTime = unknownBirthTime ? null : birthTime.trim() || null;
    const nextPlace = birthPlaceName.trim() || null;
    const nextGender = gender.trim() || null;

    try {
      const updated = await apiRequest<User>("/users/me/profile", {
        token,
        method: "PATCH",
        body: {
          fullName: fullName.trim(),
          email: email.trim().toLowerCase(),
          mobileNumber: mobileNumber.trim() || undefined,
          whatsappNumber: whatsappNumber.trim() || undefined,
          preferredLanguage,
          birthDate: nextBirthDate,
          birthTime: nextBirthTime,
          unknownBirthTime,
          birthPlaceName: nextPlace,
          gender: nextGender,
          emailMarketingConsent: emailConsent,
          whatsappMarketingConsent: whatsappConsent,
        },
      });

      writeBirthDraft({
        fullName: fullName.trim(),
        email: email.trim().toLowerCase(),
        mobileNumber: mobileNumber.trim() || undefined,
        birthDate: nextBirthDate ?? undefined,
        birthTime: nextBirthTime ?? undefined,
        unknownBirthTime,
        birthPlaceName: nextPlace ?? undefined,
        gender: nextGender ?? undefined,
        language: preferredLanguage,
        source: "profile",
      });

      setLanguage(preferredLanguage);
      // Keep session profile in sync with formatted API response
      if (updated?.id) {
        setSession({ accessToken: token, user: updated });
      } else {
        await refreshMe();
      }
      setSaved(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  if (loading || !user?.profile) {
    return <div className="mx-auto max-w-lg px-4 py-16 text-muted">Loading…</div>;
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-8 md:py-12">
      <Card className="fade-up">
        <h1 className="font-heading text-2xl text-ink">{t("profileSettings")}</h1>
        <p className="mt-1 text-sm text-muted">{t("profileSettingsHint")}</p>
        <form className="mt-6 space-y-4" onSubmit={onSubmit}>
          <Field
            label={t("fullName")}
            name="fullName"
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
          />
          <Field
            label={t("email")}
            name="email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Field
            label={t("mobile")}
            name="mobileNumber"
            type="tel"
            autoComplete="tel"
            value={mobileNumber}
            onChange={(e) => setMobileNumber(e.target.value)}
          />
          <Field
            label={t("whatsapp")}
            name="whatsappNumber"
            value={whatsappNumber}
            onChange={(e) => setWhatsappNumber(e.target.value)}
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label={t("birthDate")}
              name="birthDate"
              type="date"
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
            />
            <Field
              label={t("birthTime")}
              name="birthTime"
              type="time"
              disabled={unknownBirthTime}
              value={unknownBirthTime ? "" : birthTime}
              onChange={(e) => setBirthTime(e.target.value)}
            />
          </div>
          <label className="flex min-h-11 items-center gap-3 text-sm">
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
            value={birthPlaceName}
            onChange={(e) => setBirthPlaceName(e.target.value)}
            placeholder="Colombo, Kandy…"
          />

          <label className="block space-y-1.5 text-sm">
            <span className="text-muted">{t("gender")}</span>
            <select
              name="gender"
              value={gender}
              onChange={(e) => setGender(e.target.value)}
              className="min-h-11 w-full rounded-xl border border-line bg-[var(--input-bg)] px-3 text-ink"
            >
              <option value="">{t("gender")}</option>
              <option value="female">{t("genderFemale")}</option>
              <option value="male">{t("genderMale")}</option>
              <option value="other">{t("genderOther")}</option>
            </select>
          </label>

          <label className="block space-y-1.5 text-sm">
            <span className="text-muted">{t("language")}</span>
            <select
              name="preferredLanguage"
              value={preferredLanguage}
              onChange={(e) => setPreferredLanguage(e.target.value as Language)}
              className="min-h-11 w-full rounded-xl border border-line bg-[var(--input-bg)] px-3 text-ink"
            >
              <option value="en">English</option>
              <option value="si">සිංහල</option>
              <option value="ta">தமிழ்</option>
            </select>
          </label>
          <label className="flex min-h-11 items-center gap-3 text-sm">
            <input
              type="checkbox"
              checked={emailConsent}
              onChange={(e) => setEmailConsent(e.target.checked)}
              className="h-5 w-5 accent-[var(--accent)]"
            />
            {t("emailConsent")}
          </label>
          <label className="flex min-h-11 items-center gap-3 text-sm">
            <input
              type="checkbox"
              checked={whatsappConsent}
              onChange={(e) => setWhatsappConsent(e.target.checked)}
              className="h-5 w-5 accent-[var(--accent)]"
            />
            {t("whatsappConsent")}
          </label>
          {error ? <p className="text-sm text-[var(--danger)]">{error}</p> : null}
          {saved ? <p className="text-sm text-accent">{t("profileSavedPrefill")}</p> : null}
          <Button type="submit" fullWidth disabled={saving}>
            {saving ? t("saving") : t("save")}
          </Button>
        </form>
      </Card>

      <Card className="fade-up mt-4">
        <h2 className="font-heading text-xl text-ink">{t("changePassword")}</h2>
        <form
          className="mt-4 space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (!token) return;
            void (async () => {
              setPasswordSaving(true);
              setPasswordMsg("");
              setError("");
              try {
                await apiRequest("/auth/change-password", {
                  token,
                  method: "POST",
                  body: { currentPassword, newPassword },
                });
                setCurrentPassword("");
                setNewPassword("");
                setPasswordMsg(t("passwordChanged"));
              } catch (err) {
                setError(err instanceof ApiError ? err.message : t("sendReportFailed"));
              } finally {
                setPasswordSaving(false);
              }
            })();
          }}
        >
          <Field
            label={t("currentPassword")}
            name="currentPassword"
            type="password"
            autoComplete="current-password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            required
          />
          <Field
            label={t("newPassword")}
            name="newPassword"
            type="password"
            autoComplete="new-password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
          />
          {passwordMsg ? <p className="text-sm text-accent">{passwordMsg}</p> : null}
          <Button type="submit" fullWidth disabled={passwordSaving}>
            {passwordSaving ? t("saving") : t("changePassword")}
          </Button>
        </form>
      </Card>
    </div>
  );
}
