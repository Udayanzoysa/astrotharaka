"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { ApiError, apiRequest } from "@/lib/api";
import type { Language, RegisterPendingResponse } from "@/lib/types";
import { useUi } from "@/components/providers/ui-provider";
import { SocialAuthButtons } from "@/components/auth/social-auth-buttons";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field } from "@/components/ui/field";

export default function RegisterPage() {
  const { t, language, setLanguage } = useUi();
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const form = new FormData(e.currentTarget);
    const email = String(form.get("email") ?? "");
    const password = String(form.get("password") ?? "");
    const confirmPassword = String(form.get("confirmPassword") ?? "");
    if (password !== confirmPassword) {
      setError(t("passwordsDoNotMatch"));
      setLoading(false);
      return;
    }
    try {
      const result = await apiRequest<RegisterPendingResponse>("/auth/register", {
        body: {
          email,
          password,
          fullName: String(form.get("fullName") ?? ""),
          mobileNumber: String(form.get("mobileNumber") ?? "") || undefined,
          preferredLanguage: language,
        },
      });
      if (result.user.profile?.preferredLanguage) {
        setLanguage(result.user.profile.preferredLanguage as Language);
      }
      const q = new URLSearchParams({ email, registered: "1" });
      router.push(`/verify-email?${q.toString()}`);
    } catch (err) {
      if (err instanceof ApiError && err.code === "EMAIL_ALREADY_REGISTERED") {
        setError(t("accountExists"));
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
    <div className="mx-auto max-w-lg px-4 py-10 md:py-16">
      <Card className="fade-up">
        <h1 className="font-heading text-2xl text-ink">{t("register")}</h1>
        <p className="mt-2 text-sm text-muted">{t("slogan")}</p>
        <SocialAuthButtons />
        <form className="mt-2 space-y-4" onSubmit={onSubmit}>
          <Field label={t("fullName")} name="fullName" required minLength={2} placeholder="Kamal de Silva" />
          <Field label={t("email")} name="email" type="email" required placeholder="kamal@gmail.com" />
          <Field label={t("password")} name="password" type="password" required minLength={8} placeholder="••••••••" />
          <Field label={t("confirmPassword")} name="confirmPassword" type="password" required minLength={8} placeholder="••••••••" />
          <Field label={t("mobileOptional")} name="mobileNumber" placeholder="+94 75 555 5555" />
          {error ? <p className="text-sm text-[var(--danger)]">{error}</p> : null}
          <Button type="submit" fullWidth disabled={loading}>
            {loading ? t("saving") : t("register")}
          </Button>
        </form>
        <p className="mt-6 border-t border-line pt-4 text-sm text-muted text-center">
          {t("alreadyHaveAccount")}
          <Link href="/login" className="text-accent hover:underline font-semibold">
            {t("login")}
          </Link>
        </p>
      </Card>
    </div>
  );
}
