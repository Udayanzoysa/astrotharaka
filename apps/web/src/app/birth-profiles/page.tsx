"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { apiRequest } from "@/lib/api";
import type { BirthProfile } from "@/lib/types";
import { useAuth } from "@/components/providers/auth-provider";
import { useUi } from "@/components/providers/ui-provider";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { WarningBanner } from "@/components/ui/warning-banner";

export default function BirthProfilesPage() {
  const { token, user, loading } = useAuth();
  const { t } = useUi();
  const router = useRouter();
  const [items, setItems] = useState<BirthProfile[]>([]);
  const [busy, setBusy] = useState(true);

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, user, router]);

  useEffect(() => {
    if (!token) return;
    void (async () => {
      try {
        const data = await apiRequest<BirthProfile[]>("/birth-profiles", { token });
        setItems(data);
      } finally {
        setBusy(false);
      }
    })();
  }, [token]);

  if (loading || !user) {
    return <div className="mx-auto max-w-7xl px-4 py-16 text-muted">Loading…</div>;
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 md:py-12">
      <div className="mb-6 flex items-center justify-between gap-3">
        <h1 className="font-heading text-2xl text-ink">{t("birthProfiles")}</h1>
        <Link href="/birth-profiles/new">
          <Button>{t("addBirth")}</Button>
        </Link>
      </div>

      {busy ? <p className="text-muted">Loading…</p> : null}

      {!busy && items.length === 0 ? (
        <Card>
          <p className="text-muted">{t("noProfiles")}</p>
          <Link href="/birth-profiles/new" className="mt-4 inline-block">
            <Button>{t("addBirth")}</Button>
          </Link>
        </Card>
      ) : null}

      <div className="space-y-3">
        {items.map((item) => (
          <Card key={item.id}>
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div>
                <h2 className="font-heading text-lg text-accent">{item.fullName}</h2>
                <p className="text-sm text-muted">
                  {String(item.birthDate).slice(0, 10)} · {item.birthPlaceName}
                </p>
                {item.accuracyWarning || item.unknownBirthTime ? (
                  <div className="mt-3">
                    <WarningBanner message={item.accuracyWarning ?? t("accuracyWarning")} />
                  </div>
                ) : null}
              </div>
              <div className="flex gap-2">
                <Link href={`/birth-profiles/${item.id}`}>
                  <Button variant="ghost">{t("edit")}</Button>
                </Link>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
