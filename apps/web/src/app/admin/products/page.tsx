"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { apiRequest } from "@/lib/api";
import { productName, type Product } from "@/lib/types";
import { CONTENT_ADMIN_ROLES, useAdminAccess } from "@/components/admin/use-admin-access";
import { useUi } from "@/components/providers/ui-provider";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function AdminProductsPage() {
  const { token, loading, denied, allowed } = useAdminAccess({ roles: CONTENT_ADMIN_ROLES });
  const { language } = useUi();
  const [products, setProducts] = useState<Product[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!allowed || !token) return;
    void (async () => {
      try {
        const data = await apiRequest<Product[]>("/admin/products", { token });
        setProducts(data);
      } catch {
        setError("Failed to load admin products");
      }
    })();
  }, [allowed, token]);

  if (loading) return <p className="text-muted">Loading…</p>;
  if (denied) return <p className="text-sm text-[var(--danger)]">{denied}</p>;
  if (!allowed) return null;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <p className="text-sm text-muted">Catalogue management</p>
        <Link href="/admin/products/new">
          <Button>New product</Button>
        </Link>
      </div>
      {error ? <p className="text-sm text-[var(--danger)]">{error}</p> : null}
      <div className="space-y-3">
        {products.map((p) => (
          <Card key={p.id}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-heading text-accent">{productName(p, language)}</p>
                <p className="text-sm text-muted">
                  {p.slug} · {p.isActive === false ? "inactive" : "active"} ·{" "}
                  {p.price
                    ? `${p.price.currency} ${p.price.amount.toLocaleString()}`
                    : "no price"}
                </p>
              </div>
              <div className="flex gap-3 text-sm">
                <Link href={`/admin/products/${p.id}`} className="text-accent hover:underline">
                  Edit
                </Link>
                <Link href={`/shop/${p.slug}`} className="text-muted hover:text-ink">
                  Shop view
                </Link>
              </div>
            </div>
          </Card>
        ))}
        {products.length === 0 ? <p className="text-sm text-muted">No products yet.</p> : null}
      </div>
    </div>
  );
}
