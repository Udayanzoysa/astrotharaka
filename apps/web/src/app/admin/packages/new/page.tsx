"use client";

import Link from "next/link";
import { CONTENT_ADMIN_ROLES, useAdminAccess } from "@/components/admin/use-admin-access";
import { PackageForm } from "@/components/admin/package-form";

export default function NewAdminPackagePage() {
  const { token, loading, denied, allowed } = useAdminAccess({ roles: CONTENT_ADMIN_ROLES });

  if (loading) return <p className="text-muted">Loading…</p>;
  if (denied) return <p className="text-sm text-[var(--danger)]">{denied}</p>;
  if (!allowed || !token) return null;

  return (
    <div>
      <Link href="/admin/packages" className="text-sm text-muted hover:text-accent">
        ← Packages
      </Link>
      <h2 className="mt-2 font-heading text-xl text-accent">New package</h2>
      <PackageForm token={token} />
    </div>
  );
}
