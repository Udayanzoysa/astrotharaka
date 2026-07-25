"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { apiRequest } from "@/lib/api";
import type { AdminPromotion } from "@/lib/types";
import { PromotionForm } from "@/components/admin/promotion-form";
import { CONTENT_ADMIN_ROLES, useAdminAccess } from "@/components/admin/use-admin-access";

export default function EditAdminPromotionPage() {
  const params = useParams<{ id: string }>();
  const { token, loading, denied, allowed } = useAdminAccess({ roles: CONTENT_ADMIN_ROLES });
  const [promo, setPromo] = useState<AdminPromotion | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!allowed || !token) return;
    void (async () => {
      try {
        const data = await apiRequest<AdminPromotion>(`/admin/promotions/${params.id}`, {
          token,
        });
        setPromo(data);
      } catch {
        setError("Promotion not found");
      }
    })();
  }, [allowed, token, params.id]);

  if (loading) return <p className="text-muted">Loading…</p>;
  if (denied) return <p className="text-sm text-[var(--danger)]">{denied}</p>;
  if (!allowed) return null;

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <Link href="/admin/promotions" className="text-sm text-muted hover:text-accent">
        ← Promotions
      </Link>
      <h2 className="font-heading text-xl text-ink">Edit promotion</h2>
      {error ? <p className="text-sm text-[var(--danger)]">{error}</p> : null}
      {token && promo ? <PromotionForm token={token} initial={promo} /> : null}
    </div>
  );
}
