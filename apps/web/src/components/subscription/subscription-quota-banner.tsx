"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { apiRequest } from "@/lib/api";
import { getGuestRemaining, type GuestService } from "@/lib/guest-usage";
import type { UserSubscription } from "@/lib/types";
import { useAuth } from "@/components/providers/auth-provider";
import { useUi } from "@/components/providers/ui-provider";

type Props = {
  service: "babyNames" | "porondam" | "horoscope";
};

const guestKey: Record<Props["service"], GuestService> = {
  babyNames: "babyNames",
  porondam: "porondam",
  horoscope: "horoscope",
};

export function SubscriptionQuotaBanner({ service }: Props) {
  const { t } = useUi();
  const { user, token } = useAuth();
  const [mine, setMine] = useState<UserSubscription | null | undefined>(undefined);
  const [freeLeft, setFreeLeft] = useState(1);

  useEffect(() => {
    const sync = () => setFreeLeft(getGuestRemaining(guestKey[service]));
    sync();
    window.addEventListener("taraka-guest-usage", sync);
    window.addEventListener("focus", sync);
    return () => {
      window.removeEventListener("taraka-guest-usage", sync);
      window.removeEventListener("focus", sync);
    };
  }, [service]);

  useEffect(() => {
    if (!token) {
      setMine(null);
      return;
    }
    void (async () => {
      try {
        const sub = await apiRequest<UserSubscription | null>("/subscriptions/me", { token });
        setMine(sub);
      } catch {
        setMine(null);
      }
    })();
  }, [token]);

  const label =
    service === "babyNames"
      ? t("quotaBabyNames")
      : service === "porondam"
        ? t("quotaPorondam")
        : t("quotaHoroscope");

  if (!user) {
    return (
      <div className="rounded-xl border border-line bg-[var(--input-bg)] px-4 py-3 text-sm text-muted">
        {freeLeft > 0
          ? t("guestFreeLeft").replace("{count}", String(freeLeft)).replace("{service}", label)
          : t("guestLimitHint").replace("{service}", label)}{" "}
        <Link href="/subscription" className="text-accent hover:underline">
          {t("availableServices")}
        </Link>
      </div>
    );
  }

  if (mine === undefined) {
    return <p className="text-sm text-muted">…</p>;
  }

  if (!mine) {
    return (
      <div className="rounded-xl border border-[color-mix(in_srgb,var(--danger)_35%,transparent)] bg-[color-mix(in_srgb,var(--danger)_8%,transparent)] px-4 py-3 text-sm text-muted">
        {t("subscriptionRequired")}{" "}
        <Link href="/subscription" className="font-medium text-accent hover:underline">
          {t("subscription")}
        </Link>
      </div>
    );
  }

  const remaining =
    service === "babyNames"
      ? mine.babyNamesRemaining
      : service === "porondam"
        ? mine.porondamRemaining
        : mine.horoscopeRemaining;
  const quota =
    service === "babyNames"
      ? mine.babyNamesQuota
      : service === "porondam"
        ? mine.porondamQuota
        : mine.horoscopeQuota;

  return (
    <div className="rounded-xl border border-line bg-[var(--input-bg)] px-4 py-3 text-sm text-muted">
      <span className="text-ink">{label}</span>: {remaining}/{quota} ·{" "}
      <Link href="/subscription" className="text-accent hover:underline">
        {t("subscription")}
      </Link>
      {remaining <= 0 ? (
        <span className="mt-1 block text-[var(--danger)]">{t("subscriptionQuotaExceeded")}</span>
      ) : null}
    </div>
  );
}
