"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useMemo, useState } from "react";
import { ApiError, apiRequest } from "@/lib/api";
import { useUi } from "@/components/providers/ui-provider";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field } from "@/components/ui/field";

function ResetPasswordInner() {
  const { t } = useUi();
  const router = useRouter();
  const search = useSearchParams();
  const email = search.get("email") ?? "";
  const code = search.get("code") ?? "";
  const hasValidLink = useMemo(() => Boolean(email && code), [email, code]);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!hasValidLink) return;
    setError("");
    setInfo("");
    setLoading(true);
    const form = new FormData(e.currentTarget);
    try {
      const result = await apiRequest<{ message: string }>("/auth/reset-password", {
        body: {
          email,
          code,
          newPassword: String(form.get("newPassword") ?? ""),
        },
      });
      setInfo(result.message);
      setTimeout(() => router.push("/login"), 1500);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Reset failed");
    } finally {
      setLoading(false);
    }
  }

  if (!hasValidLink) {
    return (
      <div className="mx-auto max-w-lg px-4 py-10 md:py-16">
        <Card className="fade-up">
          <h1 className="font-heading text-2xl text-ink">{t("resetPassword")}</h1>
          <p className="mt-2 text-sm text-muted">{t("resetPasswordLinkInvalid")}</p>
          <div className="mt-6">
            <Link href="/forgot-password">
              <Button fullWidth>{t("sendResetLink")}</Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-10 md:py-16">
      <Card className="fade-up">
        <h1 className="font-heading text-2xl text-ink">{t("resetPassword")}</h1>
        <p className="mt-2 text-sm text-muted">{t("resetPasswordHint")}</p>
        <p className="mt-2 text-xs text-muted">{email}</p>
        <form className="mt-6 space-y-4" onSubmit={onSubmit}>
          <Field
            label={t("newPassword")}
            name="newPassword"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
          />
          {info ? <p className="text-sm text-ink">{info}</p> : null}
          {error ? <p className="text-sm text-[var(--danger)]">{error}</p> : null}
          <Button type="submit" fullWidth disabled={loading}>
            {loading ? t("saving") : t("resetPassword")}
          </Button>
        </form>
        <p className="mt-4 text-sm text-muted">
          <Link href="/login" className="text-accent hover:underline">
            {t("login")}
          </Link>
        </p>
      </Card>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-lg px-4 py-16 text-muted">Loading…</div>}>
      <ResetPasswordInner />
    </Suspense>
  );
}
