"use client";

import Link from "next/link";
import { Suspense, useEffect, useRef, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { type SubscriptionCheckout } from "@/lib/types";
import { useAuth } from "@/components/providers/auth-provider";
import { useUi } from "@/components/providers/ui-provider";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AdminStatusBadge } from "@/components/admin/admin-status-badge";
import { ApiError, apiRequest } from "@/lib/api";
import { allowDevPayments } from "@/lib/env";

function SubscriptionCheckoutStatusInner() {
  const { t } = useUi();
  const { token } = useAuth();
  const params = useParams<{ id: string }>();
  const search = useSearchParams();
  const [checkout, setCheckout] = useState<SubscriptionCheckout | null>(null);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const payhereHandled = useRef(false);

  async function load() {
    if (!token) return;
    try {
      const res = await apiRequest<SubscriptionCheckout>(
        `/subscriptions/checkouts/${params.id}`,
        { token },
      );
      setCheckout(res);
    } catch {
      setError(t("subscriptionLoadError"));
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, params.id]);

  useEffect(() => {
    const payhere = search.get("payhere");
    if (!token || payhere !== "return" || payhereHandled.current) return;
    payhereHandled.current = true;

    void (async () => {
      try {
        if (allowDevPayments()) {
          setInfo(t("subscriptionPayHereConfirming"));
          await apiRequest("/public/payments/payhere/subscription-sandbox-complete", {
            token,
            method: "POST",
            body: { checkoutId: params.id },
          });
          setInfo(t("subscriptionActivated"));
        } else {
          setInfo("Payment received — waiting for confirmation…");
        }
        await load();
      } catch (err) {
        setError(err instanceof ApiError ? err.message : t("subscriptionError"));
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, token, params.id]);

  useEffect(() => {
    if (!checkout) return;
    if (
      checkout.status === "AWAITING_PAYMENT" ||
      checkout.status === "PAYMENT_UNDER_REVIEW" ||
      checkout.status === "PAID"
    ) {
      const timer = window.setInterval(() => {
        void load();
      }, 3000);
      return () => window.clearInterval(timer);
    }
  }, [checkout]);

  if (!checkout && !error) {
    return <div className="mx-auto max-w-lg px-4 py-16 text-muted">Loading…</div>;
  }

  const activated = checkout?.status === "ACTIVATED";

  return (
    <div className="mx-auto max-w-lg px-4 py-8 md:py-12">
      <Card>
        <h1 className="font-heading text-2xl text-ink">{t("subscriptionCheckoutTitle")}</h1>
        {checkout ? (
          <>
            <p className="mt-2 text-sm text-muted">{checkout.checkoutNumber}</p>
            <div className="mt-4 flex items-center gap-2">
              <AdminStatusBadge status={checkout.status} />
              <span className="text-lg text-ink">LKR {checkout.priceLkr.toLocaleString()}</span>
            </div>
            <p className="mt-2 text-sm text-muted">{checkout.packageNameEn}</p>
            {checkout.status === "PAYMENT_UNDER_REVIEW" ? (
              <p className="mt-4 text-sm text-ink">{t("subscriptionAwaitingActivation")}</p>
            ) : null}
            {activated ? (
              <p className="mt-4 text-sm text-ink">{t("subscriptionActivated")}</p>
            ) : null}
          </>
        ) : null}

        {error ? <p className="mt-3 text-sm text-[var(--danger)]">{error}</p> : null}
        {info ? <p className="mt-3 text-sm text-ink">{info}</p> : null}

        <div className="mt-6 flex flex-wrap gap-2">
          <Link href="/subscription">
            <Button variant="ghost">{t("subscription")}</Button>
          </Link>
          {activated ? (
            <Link href="/dashboard">
              <Button>{t("dashboard")}</Button>
            </Link>
          ) : null}
        </div>
      </Card>
    </div>
  );
}

export default function SubscriptionCheckoutStatusPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-lg px-4 py-16 text-muted">Loading…</div>}>
      <SubscriptionCheckoutStatusInner />
    </Suspense>
  );
}
