"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { apiRequest } from "@/lib/api";
import type { AdminPromotion } from "@/lib/types";
import { CONTENT_ADMIN_ROLES, useAdminAccess } from "@/components/admin/use-admin-access";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function AdminPromotionsPage() {
  const { token, loading, denied, allowed } = useAdminAccess({ roles: CONTENT_ADMIN_ROLES });
  const [items, setItems] = useState<AdminPromotion[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!allowed || !token) return;
    void (async () => {
      try {
        const data = await apiRequest<AdminPromotion[]>("/admin/promotions", { token });
        setItems(data);
      } catch {
        setError("Failed to load promotions");
      }
    })();
  }, [allowed, token]);

  if (loading) return <p className="text-muted">Loading…</p>;
  if (denied) return <p className="text-sm text-[var(--danger)]">{denied}</p>;
  if (!allowed) return null;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <p className="text-sm text-muted">Promotional codes</p>
        <Link href="/admin/promotions/new">
          <Button>New promotion</Button>
        </Link>
      </div>
      {error ? <p className="text-sm text-[var(--danger)]">{error}</p> : null}
      <div className="space-y-3">
        {items.map((p) => (
          <Card key={p.id}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-heading text-accent">{p.code}</p>
                <p className="text-sm text-muted">
                  {p.name} · {p.discountType} {String(p.discountValue)}
                  {p.discountType === "PERCENT" ? "%" : " LKR"} ·{" "}
                  {p.isActive ? "active" : "inactive"} · limit {p.perCustomerLimit}/customer
                </p>
              </div>
              <Link href={`/admin/promotions/${p.id}`} className="text-sm text-accent hover:underline">
                Edit
              </Link>
            </div>
          </Card>
        ))}
        {items.length === 0 ? <p className="text-sm text-muted">No promotions yet.</p> : null}
      </div>
    </div>
  );
}
