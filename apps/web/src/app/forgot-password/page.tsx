"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { ApiError, apiRequest } from "@/lib/api";
import { useUi } from "@/components/providers/ui-provider";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field } from "@/components/ui/field";

export default function ForgotPasswordPage() {
  const { t } = useUi();
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setInfo("");
    setLoading(true);
    const form = new FormData(e.currentTarget);
    const email = String(form.get("email") ?? "");
    try {
      const result = await apiRequest<{ message: string }>("/auth/forgot-password", {
        body: { email },
      });
      setInfo(result.message);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Request failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-10 md:py-16">
      <Card className="fade-up">
        <h1 className="font-heading text-2xl text-ink">{t("forgotPassword")}</h1>
        <p className="mt-2 text-sm text-muted">{t("forgotPasswordHint")}</p>
        {info ? (
          <p className="mt-4 rounded-xl border border-line bg-[var(--input-bg)] px-4 py-3 text-sm text-ink">
            {info}
          </p>
        ) : (
          <form className="mt-6 space-y-4" onSubmit={onSubmit}>
            <Field label={t("email")} name="email" type="email" required />
            {error ? <p className="text-sm text-[var(--danger)]">{error}</p> : null}
            <Button type="submit" fullWidth disabled={loading}>
              {loading ? t("saving") : t("sendResetLink")}
            </Button>
          </form>
        )}
        <p className="mt-4 text-sm text-muted">
          <Link href="/login" className="text-accent hover:underline">
            {t("login")}
          </Link>
        </p>
      </Card>
    </div>
  );
}
