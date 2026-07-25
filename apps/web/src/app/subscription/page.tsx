"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ApiError, apiRequest } from "@/lib/api";
import {
  packageDescription,
  packageName,
  type SubscriptionPackage,
  type UserSubscription,
} from "@/lib/types";
import { useAuth } from "@/components/providers/auth-provider";
import { useUi } from "@/components/providers/ui-provider";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function SubscriptionPage() {
  const { t, language } = useUi();
  const { user, token } = useAuth();
  const [packages, setPackages] = useState<SubscriptionPackage[]>([]);
  const [mine, setMine] = useState<UserSubscription | null>(null);
  const [error, setError] = useState("");

  async function refresh() {
    try {
      const pkgs = await apiRequest<SubscriptionPackage[]>("/subscriptions/packages");
      setPackages(pkgs);
      if (token) {
        const sub = await apiRequest<UserSubscription | null>("/subscriptions/me", { token });
        setMine(sub);
      } else {
        setMine(null);
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("subscriptionLoadError"));
    }
  }

  useEffect(() => {
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  function subscribe(packageId: string) {
    if (!token) {
      window.location.href = `/login?next=/subscription`;
      return;
    }
    window.location.href = `/checkout/subscription?packageId=${packageId}`;
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <h1 className="font-heading text-2xl text-accent sm:text-3xl">{t("subscriptionTitle")}</h1>
      <p className="mt-2 max-w-2xl text-sm text-muted sm:text-base">{t("subscriptionHint")}</p>

      {mine ? (
        <Card className="mt-6">
          <h2 className="font-heading text-lg text-ink">{t("subscriptionActive")}</h2>
          <p className="mt-1 text-accent">
            {language === "si" && mine.packageNameSi ? mine.packageNameSi : mine.packageNameEn}
          </p>
          <p className="mt-1 text-sm text-muted">
            {t("subscriptionExpires")}: {new Date(mine.expiresAt).toLocaleDateString()}
          </p>
          <ul className="mt-3 space-y-1 text-sm text-muted">
            <li>
              {t("quotaBabyNames")}: {mine.babyNamesRemaining}/{mine.babyNamesQuota}
            </li>
            <li>
              {t("quotaPorondam")}: {mine.porondamRemaining}/{mine.porondamQuota}
            </li>
            <li>
              {t("quotaHoroscope")}: {mine.horoscopeRemaining}/{mine.horoscopeQuota}
            </li>
          </ul>
        </Card>
      ) : null}

      {error ? <p className="mt-4 text-sm text-[var(--danger)]">{error}</p> : null}

      <div className="mt-8 grid gap-4 md:grid-cols-3">
        {packages.map((pkg) => {
          const active = mine?.packageId === pkg.id && mine.status === "ACTIVE";
          return (
            <Card key={pkg.id} className="flex flex-col">
              <h3 className="font-heading text-lg text-accent">{packageName(pkg, language)}</h3>
              <p className="mt-1 text-2xl font-semibold text-ink">
                LKR {pkg.priceLkr.toLocaleString()}
                <span className="text-sm font-normal text-muted"> / {pkg.durationDays}d</span>
              </p>
              <p className="mt-2 flex-1 text-sm text-muted">{packageDescription(pkg, language)}</p>
              <ul className="mt-3 space-y-1 text-sm text-muted">
                <li>
                  {t("quotaBabyNames")}: {pkg.babyNamesQuota}
                </li>
                <li>
                  {t("quotaPorondam")}: {pkg.porondamQuota}
                </li>
                <li>
                  {t("quotaHoroscope")}: {pkg.horoscopeQuota}
                </li>
              </ul>
              <Button
                className="mt-4 w-full"
                disabled={active}
                onClick={() => subscribe(pkg.id)}
              >
                {!user
                  ? t("subscriptionLogin")
                  : active
                    ? t("subscriptionCurrent")
                    : t("subscriptionSubscribe")}
              </Button>
            </Card>
          );
        })}
      </div>

      <p className="mt-6 text-center text-xs text-muted">
        <Link href="/baby-names" className="text-accent hover:underline">
          {t("babyNames")}
        </Link>
        {" · "}
        <Link href="/porondam" className="text-accent hover:underline">
          {t("porondam")}
        </Link>
      </p>
    </div>
  );
}
