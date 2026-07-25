"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useEffect, useState } from "react";
import { ApiError, apiRequest } from "@/lib/api";
import type { AuthResponse } from "@/lib/types";
import { ADMIN_PORTAL_ROLES } from "@/components/admin/use-admin-access";
import { useAuth } from "@/components/providers/auth-provider";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field } from "@/components/ui/field";

function AdminLoginForm() {
  const { setSession, user, loading: authLoading } = useAuth();
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") || "/admin";
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (
      user &&
      ADMIN_PORTAL_ROLES.includes(user.role as (typeof ADMIN_PORTAL_ROLES)[number])
    ) {
      router.replace(next.startsWith("/admin") ? next : "/admin");
    }
  }, [user, authLoading, router, next]);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const form = new FormData(e.currentTarget);
    try {
      const session = await apiRequest<AuthResponse>("/auth/login", {
        body: {
          email: String(form.get("email") ?? ""),
          password: String(form.get("password") ?? ""),
        },
      });
      if (
        !ADMIN_PORTAL_ROLES.includes(session.user.role as (typeof ADMIN_PORTAL_ROLES)[number])
      ) {
        setError("This account is not an admin account.");
        return;
      }
      setSession(session);
      router.replace(next.startsWith("/admin") ? next : "/admin");
    } catch (err) {
      if (err instanceof ApiError) {
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
      <p className="text-xs uppercase tracking-[0.2em] text-muted">Taraka</p>
      <h1 className="mt-1 font-heading text-2xl text-ink">Admin login</h1>
      <p className="mt-1 text-sm text-muted">Staff access only — customers use the main site login.</p>
      <form className="mt-6 space-y-4" onSubmit={onSubmit}>
        <Field label="Email" name="email" type="email" required autoComplete="username" />
        <Field
          label="Password"
          name="password"
          type="password"
          required
          minLength={8}
          autoComplete="current-password"
        />
        {error ? <p className="text-sm text-[var(--danger)]">{error}</p> : null}
        <Button type="submit" fullWidth disabled={loading}>
          {loading ? "Signing in…" : "Sign in"}
        </Button>
      </form>
      <p className="mt-4 text-sm text-muted">
        <Link href="/login" className="text-accent hover:underline">
          Customer login
        </Link>
        {" · "}
        <Link href="/" className="text-accent hover:underline">
          Back to site
        </Link>
      </p>
    </Card>
  );
}

export default function AdminLoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-bg px-4 py-10">
      <div className="w-full max-w-md">
        <Suspense
          fallback={
            <Card>
              <p className="text-sm text-muted">Loading…</p>
            </Card>
          }
        >
          <AdminLoginForm />
        </Suspense>
      </div>
    </div>
  );
}
