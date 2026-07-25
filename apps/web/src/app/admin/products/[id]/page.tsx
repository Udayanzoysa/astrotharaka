"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { apiRequest } from "@/lib/api";
import type { Product } from "@/lib/types";
import { ProductForm } from "@/components/admin/product-form";
import { CONTENT_ADMIN_ROLES, useAdminAccess } from "@/components/admin/use-admin-access";

export default function EditAdminProductPage() {
  const params = useParams<{ id: string }>();
  const { token, loading, denied, allowed } = useAdminAccess({ roles: CONTENT_ADMIN_ROLES });
  const [product, setProduct] = useState<Product | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!allowed || !token) return;
    void (async () => {
      try {
        const data = await apiRequest<Product>(`/admin/products/${params.id}`, { token });
        setProduct(data);
      } catch {
        setError("Product not found");
      }
    })();
  }, [allowed, token, params.id]);

  if (loading) return <p className="text-muted">Loading…</p>;
  if (denied) return <p className="text-sm text-[var(--danger)]">{denied}</p>;
  if (!allowed) return null;

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <Link href="/admin/products" className="text-sm text-muted hover:text-accent">
        ← Products
      </Link>
      <h2 className="font-heading text-xl text-ink">Edit product</h2>
      {error ? <p className="text-sm text-[var(--danger)]">{error}</p> : null}
      {token && product ? <ProductForm token={token} initial={product} /> : null}
    </div>
  );
}
