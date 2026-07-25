"use client";

import Link from "next/link";
import { PromotionForm } from "@/components/admin/promotion-form";
import { CONTENT_ADMIN_ROLES, useAdminAccess } from "@/components/admin/use-admin-access";

export default function NewAdminPromotionPage() {
  const { token, loading, denied, allowed } = useAdminAccess({ roles: CONTENT_ADMIN_ROLES });

  if (loading) return <p className="text-muted">Loading…</p>;
  if (denied) return <p className="text-sm text-[var(--danger)]">{denied}</p>;
  if (!allowed || !token) return null;

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <Link href="/admin/promotions" className="text-sm text-muted hover:text-accent">
        ← Promotions
      </Link>
      <h2 className="font-heading text-xl text-ink">New promotion</h2>
      <PromotionForm token={token} />
    </div>
  );
}
