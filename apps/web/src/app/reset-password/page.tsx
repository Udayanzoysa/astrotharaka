"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useState } from "react";
import { ApiError, apiRequest } from "@/lib/api";
import { useUi } from "@/components/providers/ui-provider";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field } from "@/components/ui/field";

function ResetPasswordInner() {
  const { t } = useUi();
  const router = useRouter();
  const search = useSearchParams();
  const initialEmail = search.get("email") ?? "";
  const [devHint] = useState(search.get("devCode") ?? "");
  const [error, setError] = useState("");
  const [info, setInfo] = useState(
    search.get("devCode") ? `Dev code: ${search.get("devCode")}` : "",
  );
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const form = new FormData(e.currentTarget);
    try {
      await apiRequest("/auth/reset-password", {
        body: {
          email: String(form.get("email") ?? ""),
          code: String(form.get("code") ?? ""),
          newPassword: String(form.get("newPassword") ?? ""),
        },
      });
      router.push("/login");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Reset failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-10 md:py-16">
      <Card className="fade-up">
        <h1 className="font-heading text-2xl text-ink">{t("resetPassword")}</h1>
        <p className="mt-2 text-sm text-muted">{t("resetPasswordHint")}</p>
        <form className="mt-6 space-y-4" onSubmit={onSubmit}>
          <Field label={t("email")} name="email" type="email" required defaultValue={initialEmail} />
          <Field
            label={t("otpCode")}
            name="code"
            required
            minLength={4}
            defaultValue={devHint}
          />
          <Field
            label={t("newPassword")}
            name="newPassword"
            type="password"
            required
            minLength={8}
          />
          {info ? <p className="text-sm text-accent">{info}</p> : null}
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
