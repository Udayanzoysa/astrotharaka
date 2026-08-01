"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useState, useEffect } from "react";
import { ApiError, apiRequest } from "@/lib/api";
import type { AuthResponse } from "@/lib/types";
import { useAuth } from "@/components/providers/auth-provider";
import { useUi } from "@/components/providers/ui-provider";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field } from "@/components/ui/field";

function VerifyEmailInner() {
  const { t } = useUi();
  const { setSession } = useAuth();
  const router = useRouter();
  const search = useSearchParams();
  const initialEmail = search.get("email") ?? "";
  const linkCode = search.get("code") ?? "";
  const [error, setError] = useState("");
  const [info, setInfo] = useState(
    search.get("registered") === "1" ? t("verifyEmailCheckInbox") : "",
  );
  const [loading, setLoading] = useState(false);
  const [autoVerifying, setAutoVerifying] = useState(false);

  useEffect(() => {
    const code = search.get("code");
    const email = search.get("email");
    if (code && email && !autoVerifying) {
      setAutoVerifying(true);
      setError("");
      setLoading(true);
      void (async () => {
        try {
          const session = await apiRequest<AuthResponse>("/auth/verify-email", {
            body: { email, code },
          });
          setSession(session);
          const next = search.get("next");
          router.push(next && next.startsWith("/") ? next : "/dashboard");
        } catch (err) {
          setError(err instanceof ApiError ? err.message : "Verification failed");
        } finally {
          setLoading(false);
        }
      })();
    }
  }, [search, autoVerifying, setSession, router]);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const form = new FormData(e.currentTarget);
    try {
      const session = await apiRequest<AuthResponse>("/auth/verify-email", {
        body: {
          email: String(form.get("email") ?? ""),
          code: String(form.get("code") ?? ""),
        },
      });
      setSession(session);
      const next = search.get("next");
      router.push(next && next.startsWith("/") ? next : "/dashboard");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Verification failed");
    } finally {
      setLoading(false);
    }
  }

  async function resend() {
    const email = (document.getElementById("email") as HTMLInputElement | null)?.value ?? initialEmail;
    if (!email) return;
    setError("");
    try {
      const result = await apiRequest<{ message: string }>("/auth/resend-otp", {
        body: { email },
      });
      setInfo(result.message);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Resend failed");
    }
  }

  if (autoVerifying || (linkCode && initialEmail)) {
    return (
      <div className="mx-auto max-w-lg px-4 py-10 md:py-16">
        <Card className="fade-up">
          <h1 className="font-heading text-2xl text-ink">{t("verifyEmail")}</h1>
          <p className="mt-4 text-sm text-muted">{loading ? t("saving") : t("verifyEmailHint")}</p>
          {error ? <p className="mt-3 text-sm text-[var(--danger)]">{error}</p> : null}
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-10 md:py-16">
      <Card className="fade-up">
        <h1 className="font-heading text-2xl text-ink">{t("verifyEmail")}</h1>
        <p className="mt-2 text-sm text-muted">{t("verifyEmailHint")}</p>
        {info ? (
          <p className="mt-4 rounded-xl border border-line bg-[var(--input-bg)] px-4 py-3 text-sm text-ink">
            {info}
          </p>
        ) : null}
        <form className="mt-6 space-y-4" onSubmit={onSubmit}>
          <Field
            label={t("email")}
            name="email"
            id="email"
            type="email"
            required
            defaultValue={initialEmail}
          />
          <Field
            label={t("otpCode")}
            name="code"
            required
            minLength={4}
            defaultValue={linkCode || undefined}
            placeholder="6-digit code"
          />
          {error ? <p className="text-sm text-[var(--danger)]">{error}</p> : null}
          <Button type="submit" fullWidth disabled={loading}>
            {loading ? t("saving") : t("verifyEmail")}
          </Button>
        </form>
        <div className="mt-4 flex flex-wrap gap-3 text-sm">
          <button type="button" className="text-accent hover:underline" onClick={() => void resend()}>
            {t("resendOtp")}
          </button>
          <Link href="/login" className="text-muted hover:text-ink">
            {t("login")}
          </Link>
        </div>
      </Card>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-lg px-4 py-16 text-muted">Loading…</div>}>
      <VerifyEmailInner />
    </Suspense>
  );
}
