"use client";

import { FormEvent, useEffect, useState } from "react";
import { ApiError, apiRequest } from "@/lib/api";
import { useAuth } from "@/components/providers/auth-provider";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { WarningBanner } from "@/components/ui/warning-banner";

type TabId = "branding" | "seo" | "email" | "verification";

type VerificationSettings = {
  verificationMethod: string;
};

type BrandingSettings = {
  siteName: string;
  description: string;
  slogan: string;
  logoUrl: string;
  faviconUrl: string;
  h1Text: string;
  colorPrimary: string;
  colorSecondary: string;
  colorAccent: string;
  buttonStyle: string;
  defaultLanguage: string;
};

type SeoSettings = {
  metaTitle: string;
  metaDescription: string;
  keywords: string;
  googleAnalyticsId: string;
  googleSearchConsoleCode: string;
  ogImageUrl: string;
};

type SmtpPublic = {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  from: string;
  hasPassword: boolean;
  source: string;
  encryption: string;
  profileHint: string;
};

type TemplateCatalog = {
  items: Array<{ id: string; title: string; description: string }>;
  previews: Record<string, { subject: string; text: string; html: string }>;
};

const TABS: Array<{ id: TabId; label: string }> = [
  { id: "branding", label: "Branding" },
  { id: "seo", label: "SEO" },
  { id: "email", label: "Email / SMTP" },
  { id: "verification", label: "Verification Settings" },
];

export default function AdminSettingsPage() {
  const { token } = useAuth();
  const [tab, setTab] = useState<TabId>("branding");
  const [error, setError] = useState("");
  const [saved, setSaved] = useState("");
  const [saving, setSaving] = useState(false);

  const [branding, setBranding] = useState<BrandingSettings | null>(null);
  const [seo, setSeo] = useState<SeoSettings | null>(null);

  const [smtp, setSmtp] = useState<SmtpPublic | null>(null);
  const [templates, setTemplates] = useState<TemplateCatalog | null>(null);
  const [previewId, setPreviewId] = useState("email_verify");
  const [testing, setTesting] = useState(false);
  const [host, setHost] = useState("mail.privateemail.com");
  const [port, setPort] = useState(465);
  const [secure, setSecure] = useState(true);
  const [user, setUser] = useState("");
  const [from, setFrom] = useState("");
  const [pass, setPass] = useState("");
  const [testTo, setTestTo] = useState("");
  const [verification, setVerification] = useState<VerificationSettings | null>(null);

  useEffect(() => {
    if (!token) return;
    void (async () => {
      try {
        const [b, s, smtpCfg, t, v] = await Promise.all([
          apiRequest<BrandingSettings>("/admin/settings/branding", { token }),
          apiRequest<SeoSettings>("/admin/settings/seo", { token }),
          apiRequest<SmtpPublic>("/admin/settings/smtp", { token }),
          apiRequest<TemplateCatalog>("/admin/settings/email-templates", { token }),
          apiRequest<VerificationSettings>("/admin/settings/verification", { token }).catch(() => ({ verificationMethod: "EMAIL" })),
        ]);
        setBranding(b);
        setSeo(s);
        setSmtp(smtpCfg);
        setHost(smtpCfg.host);
        setPort(smtpCfg.port);
        setSecure(smtpCfg.secure);
        setUser(smtpCfg.user);
        setFrom(smtpCfg.from);
        setTestTo(smtpCfg.user || "");
        setTemplates(t);
        if (t.items[0]) setPreviewId(t.items[0].id);
        setVerification(v);
      } catch (err) {
        setError(err instanceof ApiError ? err.message : "Failed to load settings");
      }
    })();
  }, [token]);

  async function onSaveVerification(e: FormEvent) {
    e.preventDefault();
    if (!token || !verification) return;
    setSaving(true);
    setError("");
    setSaved("");
    try {
      const next = await apiRequest<VerificationSettings>("/admin/settings/verification", {
        token,
        method: "PUT",
        body: verification,
      });
      setVerification(next);
      setSaved("Verification settings saved.");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function onSaveBranding(e: FormEvent) {
    e.preventDefault();
    if (!token || !branding) return;
    setSaving(true);
    setError("");
    setSaved("");
    try {
      const next = await apiRequest<BrandingSettings>("/admin/settings/branding", {
        token,
        method: "PUT",
        body: branding,
      });
      setBranding(next);
      setSaved("Branding settings saved.");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function onSaveSeo(e: FormEvent) {
    e.preventDefault();
    if (!token || !seo) return;
    setSaving(true);
    setError("");
    setSaved("");
    try {
      const next = await apiRequest<SeoSettings>("/admin/settings/seo", {
        token,
        method: "PUT",
        body: seo,
      });
      setSeo(next);
      setSaved("SEO settings saved.");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function onSaveSmtp(e: FormEvent) {
    e.preventDefault();
    if (!token) return;
    setSaving(true);
    setError("");
    setSaved("");
    try {
      const next = await apiRequest<SmtpPublic>("/admin/settings/smtp", {
        token,
        method: "PUT",
        body: {
          host,
          port: Number(port),
          secure,
          user,
          from,
          ...(pass.trim() ? { pass: pass.trim() } : {}),
        },
      });
      setSmtp(next);
      setPass("");
      setSaved("SMTP settings saved.");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function onTest() {
    if (!token || !testTo.trim()) return;
    setTesting(true);
    setError("");
    setSaved("");
    try {
      const res = await apiRequest<{ ok: boolean; provider: string; detail?: string }>(
        "/admin/settings/smtp/test",
        { token, method: "POST", body: { to: testTo.trim() } },
      );
      setSaved(`Test email sent via ${res.provider}${res.detail ? ` (${res.detail})` : ""}.`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Test send failed");
    } finally {
      setTesting(false);
    }
  }

  const preview = templates?.previews[previewId];

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="font-heading text-2xl text-ink">Settings</h1>
        <p className="mt-1 text-sm text-muted">
          Branding, SEO, and outgoing email configuration.
        </p>
      </div>

      <div className="flex flex-wrap gap-2 border-b border-line pb-3">
        {TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => {
              setTab(item.id);
              setSaved("");
              setError("");
            }}
            className={`rounded-xl px-3 py-2 text-sm transition ${
              tab === item.id
                ? "bg-accent font-medium text-[#0B0F19]"
                : "text-muted hover:bg-[var(--input-bg)] hover:text-ink"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {error ? <WarningBanner message={error} /> : null}
      {saved ? (
        <p className="rounded-xl border border-[color-mix(in_srgb,#d4af37_35%,var(--border))] px-3 py-2 text-sm text-ink">
          {saved}
        </p>
      ) : null}

      {tab === "branding" ? (
        <form
          onSubmit={(e) => void onSaveBranding(e)}
          className="space-y-4 rounded-2xl border border-line bg-[color-mix(in_srgb,var(--bg)_90%,#13213a)] p-4 sm:p-5"
        >
          <div>
            <h2 className="font-heading text-lg text-ink">Branding</h2>
            <p className="mt-1 text-xs text-muted">Site identity, visual assets, theme, and default language.</p>
          </div>
          {!branding ? (
            <p className="text-sm text-muted">Loading…</p>
          ) : (
            <>
              <div className="grid gap-3 md:grid-cols-2">
                <Field
                  label="Site name"
                  name="siteName"
                  value={branding.siteName}
                  onChange={(e) => setBranding({ ...branding, siteName: e.target.value })}
                  required
                />
                <Field
                  label="Slogan"
                  name="slogan"
                  value={branding.slogan}
                  onChange={(e) => setBranding({ ...branding, slogan: e.target.value })}
                />
              </div>
              <Field
                label="Description"
                name="description"
                value={branding.description}
                onChange={(e) => setBranding({ ...branding, description: e.target.value })}
              />
              <Field
                label="Default H1 text"
                name="h1Text"
                value={branding.h1Text}
                onChange={(e) => setBranding({ ...branding, h1Text: e.target.value })}
              />
              <div className="grid gap-3 md:grid-cols-2">
                <Field
                  label="Logo URL"
                  name="logoUrl"
                  value={branding.logoUrl}
                  onChange={(e) => setBranding({ ...branding, logoUrl: e.target.value })}
                  placeholder="/brand/logo.png"
                />
                <Field
                  label="Favicon URL"
                  name="faviconUrl"
                  value={branding.faviconUrl}
                  onChange={(e) => setBranding({ ...branding, faviconUrl: e.target.value })}
                  placeholder="/favicon.ico"
                />
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <label className="block text-sm text-muted">
                  Primary color
                  <input
                    type="color"
                    className="mt-1 h-11 w-full cursor-pointer rounded-xl border border-line bg-[var(--input-bg)]"
                    value={branding.colorPrimary}
                    onChange={(e) => setBranding({ ...branding, colorPrimary: e.target.value })}
                  />
                </label>
                <label className="block text-sm text-muted">
                  Secondary color
                  <input
                    type="color"
                    className="mt-1 h-11 w-full cursor-pointer rounded-xl border border-line bg-[var(--input-bg)]"
                    value={branding.colorSecondary}
                    onChange={(e) => setBranding({ ...branding, colorSecondary: e.target.value })}
                  />
                </label>
                <label className="block text-sm text-muted">
                  Accent color
                  <input
                    type="color"
                    className="mt-1 h-11 w-full cursor-pointer rounded-xl border border-line bg-[var(--input-bg)]"
                    value={branding.colorAccent}
                    onChange={(e) => setBranding({ ...branding, colorAccent: e.target.value })}
                  />
                </label>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <label className="block text-sm text-muted">
                  Button style
                  <select
                    className="mt-1 min-h-11 w-full rounded-xl border border-line bg-[var(--input-bg)] px-3 text-ink"
                    value={branding.buttonStyle}
                    onChange={(e) => setBranding({ ...branding, buttonStyle: e.target.value })}
                  >
                    <option value="rounded">Rounded</option>
                    <option value="pill">Pill</option>
                    <option value="square">Square</option>
                  </select>
                </label>
                <label className="block text-sm text-muted">
                  Default language
                  <select
                    className="mt-1 min-h-11 w-full rounded-xl border border-line bg-[var(--input-bg)] px-3 text-ink"
                    value={branding.defaultLanguage}
                    onChange={(e) => setBranding({ ...branding, defaultLanguage: e.target.value })}
                  >
                    <option value="en">English</option>
                    <option value="si">Sinhala</option>
                    <option value="ta">Tamil</option>
                  </select>
                </label>
              </div>
              <div className="flex justify-end pt-2">
                <Button type="submit" disabled={saving}>
                  {saving ? "Saving…" : "Save branding"}
                </Button>
              </div>
            </>
          )}
        </form>
      ) : null}

      {tab === "seo" ? (
        <form
          onSubmit={(e) => void onSaveSeo(e)}
          className="space-y-4 rounded-2xl border border-line bg-[color-mix(in_srgb,var(--bg)_90%,#13213a)] p-4 sm:p-5"
        >
          <div>
            <h2 className="font-heading text-lg text-ink">SEO settings</h2>
            <p className="mt-1 text-xs text-muted">
              Default metadata, analytics IDs, and social preview image.
            </p>
          </div>
          {!seo ? (
            <p className="text-sm text-muted">Loading…</p>
          ) : (
            <>
              <Field
                label="Meta title"
                name="metaTitle"
                value={seo.metaTitle}
                onChange={(e) => setSeo({ ...seo, metaTitle: e.target.value })}
                required
              />
              <Field
                label="Meta description"
                name="metaDescription"
                value={seo.metaDescription}
                onChange={(e) => setSeo({ ...seo, metaDescription: e.target.value })}
                required
              />
              <Field
                label="Keywords (comma-separated)"
                name="keywords"
                value={seo.keywords}
                onChange={(e) => setSeo({ ...seo, keywords: e.target.value })}
              />
              <div className="grid gap-3 md:grid-cols-2">
                <Field
                  label="Google Analytics ID"
                  name="googleAnalyticsId"
                  value={seo.googleAnalyticsId}
                  onChange={(e) => setSeo({ ...seo, googleAnalyticsId: e.target.value })}
                  placeholder="G-XXXXXXXX"
                />
                <Field
                  label="Google Search Console verification"
                  name="googleSearchConsoleCode"
                  value={seo.googleSearchConsoleCode}
                  onChange={(e) => setSeo({ ...seo, googleSearchConsoleCode: e.target.value })}
                  placeholder="verification code / meta content"
                />
              </div>
              <Field
                label="Open Graph image URL"
                name="ogImageUrl"
                value={seo.ogImageUrl}
                onChange={(e) => setSeo({ ...seo, ogImageUrl: e.target.value })}
                placeholder="/brand/og.png"
              />
              <div className="flex justify-end pt-2">
                <Button type="submit" disabled={saving}>
                  {saving ? "Saving…" : "Save SEO"}
                </Button>
              </div>
            </>
          )}
        </form>
      ) : null}

      {tab === "email" ? (
        <div className="grid gap-6 lg:grid-cols-2">
          <form
            onSubmit={(e) => void onSaveSmtp(e)}
            className="space-y-3 rounded-2xl border border-line bg-[color-mix(in_srgb,var(--bg)_90%,#13213a)] p-4 sm:p-5"
          >
            <div>
              <h2 className="font-heading text-lg text-ink">SMTP / Outgoing mail</h2>
              <p className="mt-1 text-xs text-muted">
                {smtp?.profileHint ||
                  "Default profile: Namecheap Private Email (mail.privateemail.com) with SSL on port 465."}
              </p>
              {smtp ? (
                <p className="mt-1 text-[11px] text-muted">Active source: {smtp.source}</p>
              ) : null}
            </div>

            <Field label="Outgoing server name" name="host" value={host} onChange={(e) => setHost(e.target.value)} required />
            <label className="block text-sm text-muted">
              Outgoing port
              <select
                className="mt-1 min-h-11 w-full rounded-xl border border-line bg-[var(--input-bg)] px-3 text-ink"
                value={port}
                onChange={(e) => {
                  const next = Number(e.target.value);
                  setPort(next);
                  setSecure(next === 465);
                }}
              >
                <option value={465}>465 (SSL)</option>
                <option value={587}>587 (STARTTLS)</option>
                <option value={25}>25</option>
              </select>
            </label>
            <label className="block text-sm text-muted">
              Type of security (encryption)
              <select
                className="mt-1 min-h-11 w-full rounded-xl border border-line bg-[var(--input-bg)] px-3 text-ink"
                value={secure ? "ssl" : "starttls"}
                onChange={(e) => setSecure(e.target.value === "ssl")}
              >
                <option value="ssl">SSL</option>
                <option value="starttls">STARTTLS</option>
              </select>
            </label>
            <Field label="SMTP username" name="user" value={user} onChange={(e) => setUser(e.target.value)} required />
            <Field
              label="SMTP password"
              name="pass"
              type="password"
              value={pass}
              onChange={(e) => setPass(e.target.value)}
              placeholder={smtp?.hasPassword ? "********" : "SMTP password"}
              autoComplete="new-password"
            />
            <Field label="From address" name="from" value={from} onChange={(e) => setFrom(e.target.value)} required />
            <div className="flex flex-wrap justify-end gap-2 pt-2">
              <Button type="submit" disabled={saving}>
                {saving ? "Saving…" : "Save SMTP settings"}
              </Button>
            </div>
            <div className="border-t border-line pt-4">
              <p className="text-sm text-ink">Send test email</p>
              <div className="mt-2 flex flex-col gap-2 sm:flex-row">
                <input
                  className="min-h-11 flex-1 rounded-xl border border-line bg-[var(--input-bg)] px-3 text-ink"
                  value={testTo}
                  onChange={(e) => setTestTo(e.target.value)}
                  placeholder="you@example.com"
                />
                <Button type="button" variant="ghost" disabled={testing} onClick={() => void onTest()}>
                  {testing ? "Sending…" : "Send test"}
                </Button>
              </div>
            </div>
          </form>

          <div className="space-y-3 rounded-2xl border border-line bg-[color-mix(in_srgb,var(--bg)_90%,#13213a)] p-4 sm:p-5">
            <div>
              <h2 className="font-heading text-lg text-ink">Email template preview</h2>
              <p className="mt-1 text-xs text-muted">
                Preview transactional templates used for onboarding, security, and report delivery.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {(templates?.items ?? []).map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setPreviewId(item.id)}
                  className={`rounded-full border px-3 py-1.5 text-xs ${
                    previewId === item.id
                      ? "border-accent bg-[color-mix(in_srgb,#d4af37_18%,transparent)] text-ink"
                      : "border-line text-muted"
                  }`}
                >
                  {item.title}
                </button>
              ))}
            </div>
            {preview ? (
              <div className="space-y-2">
                <p className="text-xs text-muted">Subject: {preview.subject}</p>
                <div
                  className="max-h-[28rem] overflow-auto rounded-xl border border-line bg-white"
                  dangerouslySetInnerHTML={{ __html: preview.html }}
                />
              </div>
            ) : (
              <p className="text-sm text-muted">Loading templates…</p>
            )}
          </div>
        </div>
      ) : null}

      {tab === "verification" ? (
        <form
          onSubmit={(e) => void onSaveVerification(e)}
          className="space-y-4 rounded-2xl border border-line bg-[color-mix(in_srgb,var(--bg)_90%,#13213a)] p-4 sm:p-5"
        >
          <div>
            <h2 className="font-heading text-lg text-ink">Verification Settings</h2>
            <p className="mt-1 text-xs text-muted">Configure the default account verification method.</p>
          </div>
          {!verification ? (
            <p className="text-sm text-muted">Loading…</p>
          ) : (
            <>
              <div className="space-y-3">
                <label className="block text-ink space-y-1.5">
                  <span className="block text-muted text-sm">Verification Method</span>
                  <select
                    value={verification.verificationMethod}
                    onChange={(e) => setVerification({ ...verification, verificationMethod: e.target.value })}
                    className="min-h-11 w-full rounded-xl border border-line bg-[var(--input-bg)] px-3 text-ink"
                  >
                    <option value="EMAIL">Email Verification (clickable link token)</option>
                    <option value="MOBILE">Mobile OTP Verification (6-digit code)</option>
                  </select>
                </label>
              </div>
              <div className="flex justify-end pt-2">
                <Button type="submit" disabled={saving}>
                  {saving ? "Saving…" : "Save verification settings"}
                </Button>
              </div>
            </>
          )}
        </form>
      ) : null}
    </div>
  );
}
