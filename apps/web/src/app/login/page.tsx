"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useEffect, useState } from "react";
import { ApiError, apiRequest } from "@/lib/api";
import type { AuthResponse } from "@/lib/types";
import { useAuth } from "@/components/providers/auth-provider";
import { useUi } from "@/components/providers/ui-provider";
import { SocialAuthButtons } from "@/components/auth/social-auth-buttons";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field } from "@/components/ui/field";

function oauthErrorMessage(code: string | null, t: (k: string) => string): string {
  if (!code) return "";
  if (code === "google_not_configured" || code === "facebook_not_configured") {
    return t("oauthNotConfigured");
  }
  if (code === "oauth_email_required") return t("oauthEmailRequired");
  return t("oauthFailed");
}

function LoginForm() {
  const { t } = useUi();
  const { setSession } = useAuth();
  const router = useRouter();
  const params = useSearchParams();
  const [error, setError] = useState("");
  const [needsVerify, setNeedsVerify] = useState(false);
  const [loading, setLoading] = useState(false);
  const [emailForVerify, setEmailForVerify] = useState("");

  useEffect(() => {
    const oauthErr = oauthErrorMessage(params.get("error"), t);
    if (oauthErr) setError(oauthErr);
  }, [params, t]);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setNeedsVerify(false);
    setLoading(true);
    const form = new FormData(e.currentTarget);
    const email = String(form.get("email") ?? "");
    setEmailForVerify(email);
    try {
      const session = await apiRequest<AuthResponse>("/auth/login", {
        body: {
          email,
          password: String(form.get("password") ?? ""),
        },
      });
      setSession(session);
      router.push("/dashboard");
    } catch (err) {
      if (err instanceof ApiError && err.code === "INVALID_CREDENTIALS") {
        setError(t("invalidCredentials"));
      } else if (err instanceof ApiError && err.code === "SOCIAL_LOGIN_REQUIRED") {
        setError(t("socialLoginRequired"));
      } else if (err instanceof ApiError && err.code === "USER_BLOCKED") {
        setError(t("userBlocked"));
      } else if (err instanceof ApiError && err.code === "EMAIL_NOT_VERIFIED") {
        setError(t("emailNotVerified"));
        setNeedsVerify(true);
      } else if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Something went wrong");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="fade-up">
      <h1 className="font-heading text-2xl text-ink">{t("login")}</h1>
      <SocialAuthButtons />
      <form className="mt-2 space-y-4" onSubmit={onSubmit}>
        <Field label={t("email")} name="email" type="email" required />
        <Field label={t("password")} name="password" type="password" required minLength={8} />
        {error ? <p className="text-sm text-[var(--danger)]">{error}</p> : null}
        <Button type="submit" fullWidth disabled={loading}>
          {loading ? t("saving") : t("login")}
        </Button>
      </form>
      <div className="mt-6 border-t border-line pt-4 space-y-3 text-sm text-center">
        <p>
          <Link href="/forgot-password" className="text-accent hover:underline font-medium">
            {t("forgotPassword")}
          </Link>
        </p>
        {needsVerify && emailForVerify ? (
          <p>
            <Link
              href={`/verify-email?email=${encodeURIComponent(emailForVerify)}`}
              className="text-accent hover:underline font-medium"
            >
              {t("verifyEmail")}
            </Link>
          </p>
        ) : null}
        <p className="text-muted">
          {t("dontHaveAccount")}
          <Link href="/register" className="text-accent hover:underline font-semibold">
            {t("register")}
          </Link>
        </p>
      </div>
    </Card>
  );
}

export default function LoginPage() {
  return (
    <div className="mx-auto max-w-lg px-4 py-10 md:py-16">
      <Suspense
        fallback={
          <Card className="fade-up">
            <p className="text-sm text-muted">…</p>
          </Card>
        }
      >
        <LoginForm />
      </Suspense>
    </div>
  );
}
