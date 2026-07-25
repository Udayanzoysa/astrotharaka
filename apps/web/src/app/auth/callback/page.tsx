"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/components/providers/auth-provider";
import { useUi } from "@/components/providers/ui-provider";
import { Card } from "@/components/ui/card";

function AuthCallbackInner() {
  const { t } = useUi();
  const { loginWithToken } = useAuth();
  const router = useRouter();
  const params = useSearchParams();
  const [error, setError] = useState("");

  useEffect(() => {
    const token = params.get("accessToken");
    if (!token) {
      setError(t("oauthFailed"));
      return;
    }
    void (async () => {
      try {
        await loginWithToken(token);
        router.replace("/dashboard");
      } catch {
        setError(t("oauthFailed"));
      }
    })();
  }, [params, loginWithToken, router, t]);

  return (
    <Card className="fade-up">
      <h1 className="font-heading text-2xl text-ink">{t("signingIn")}</h1>
      {error ? (
        <>
          <p className="mt-4 text-sm text-[var(--danger)]">{error}</p>
          <p className="mt-3 text-sm text-muted">
            <Link href="/login" className="text-accent hover:underline">
              {t("login")}
            </Link>
          </p>
        </>
      ) : (
        <p className="mt-4 text-sm text-muted">{t("saving")}</p>
      )}
    </Card>
  );
}

export default function AuthCallbackPage() {
  return (
    <div className="mx-auto max-w-lg px-4 py-10 md:py-16">
      <Suspense
        fallback={
          <Card className="fade-up">
            <p className="text-sm text-muted">…</p>
          </Card>
        }
      >
        <AuthCallbackInner />
      </Suspense>
    </div>
  );
}
