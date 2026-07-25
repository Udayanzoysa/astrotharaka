"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { apiRequest } from "@/lib/api";
import type { SubscriptionPackage } from "@/lib/types";
import { CONTENT_ADMIN_ROLES, useAdminAccess } from "@/components/admin/use-admin-access";
import { PackageForm } from "@/components/admin/package-form";

export default function EditAdminPackagePage() {
  const params = useParams<{ id: string }>();
  const { token, loading, denied, allowed } = useAdminAccess({ roles: CONTENT_ADMIN_ROLES });
  const [pkg, setPkg] = useState<SubscriptionPackage | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!allowed || !token || !params.id) return;
    void (async () => {
      try {
        const data = await apiRequest<SubscriptionPackage>(`/admin/packages/${params.id}`, {
          token,
        });
        setPkg(data);
      } catch {
        setError("Package not found");
      }
    })();
  }, [allowed, token, params.id]);

  if (loading) return <p className="text-muted">Loading…</p>;
  if (denied) return <p className="text-sm text-[var(--danger)]">{denied}</p>;
  if (!allowed) return null;

  return (
    <div>
      <Link href="/admin/packages" className="text-sm text-muted hover:text-accent">
        ← Packages
      </Link>
      <h2 className="mt-2 font-heading text-xl text-accent">Edit package</h2>
      {error ? <p className="mt-2 text-sm text-[var(--danger)]">{error}</p> : null}
      {token && pkg ? <PackageForm token={token} initial={pkg} /> : null}
    </div>
  );
}
