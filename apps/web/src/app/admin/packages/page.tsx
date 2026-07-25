"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { apiRequest } from "@/lib/api";
import { packageName, type SubscriptionPackage } from "@/lib/types";
import { CONTENT_ADMIN_ROLES, useAdminAccess } from "@/components/admin/use-admin-access";
import { useUi } from "@/components/providers/ui-provider";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function AdminPackagesPage() {
  const { token, loading, denied, allowed } = useAdminAccess({ roles: CONTENT_ADMIN_ROLES });
  const { language, t } = useUi();
  const [packages, setPackages] = useState<SubscriptionPackage[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!allowed || !token) return;
    void (async () => {
      try {
        const data = await apiRequest<SubscriptionPackage[]>("/admin/packages", { token });
        setPackages(data);
      } catch {
        setError("Failed to load packages");
      }
    })();
  }, [allowed, token]);

  async function deactivate(id: string) {
    if (!token) return;
    if (!confirm("Deactivate this package? Existing subscribers keep their current plan.")) return;
    try {
      await apiRequest(`/admin/packages/${id}`, { method: "DELETE", token });
      setPackages((prev) => prev.map((p) => (p.id === id ? { ...p, isActive: false } : p)));
    } catch {
      setError("Could not deactivate package");
    }
  }

  if (loading) return <p className="text-muted">Loading…</p>;
  if (denied) return <p className="text-sm text-[var(--danger)]">{denied}</p>;
  if (!allowed) return null;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <p className="text-sm text-muted">{t("adminPackagesHint")}</p>
        <Link href="/admin/packages/new">
          <Button>{t("adminPackageNew")}</Button>
        </Link>
      </div>
      {error ? <p className="text-sm text-[var(--danger)]">{error}</p> : null}
      <div className="space-y-3">
        {packages.map((pkg) => (
          <Card key={pkg.id}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-heading text-accent">{packageName(pkg, language)}</p>
                <p className="text-sm text-muted">
                  {pkg.code} · LKR {pkg.priceLkr.toLocaleString()} / {pkg.durationDays}d ·{" "}
                  {pkg.isActive ? "active" : "inactive"}
                </p>
                <p className="mt-1 text-xs text-muted">
                  Baby names {pkg.babyNamesQuota} · Porondam {pkg.porondamQuota} · Horoscope{" "}
                  {pkg.horoscopeQuota}
                </p>
              </div>
              <div className="flex gap-3 text-sm">
                <Link href={`/admin/packages/${pkg.id}`} className="text-accent hover:underline">
                  {t("adminPackageEdit")}
                </Link>
                {pkg.isActive ? (
                  <button
                    type="button"
                    className="text-muted hover:text-[var(--danger)]"
                    onClick={() => void deactivate(pkg.id)}
                  >
                    {t("adminPackageDeactivate")}
                  </button>
                ) : null}
              </div>
            </div>
          </Card>
        ))}
        {packages.length === 0 ? <p className="text-sm text-muted">No packages yet.</p> : null}
      </div>
    </div>
  );
}
