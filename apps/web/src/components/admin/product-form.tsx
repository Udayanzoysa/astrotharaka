"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { ApiError, apiRequest } from "@/lib/api";
import type { Product } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";

type Props = {
  token: string;
  initial?: Product | null;
};

export function ProductForm({ token, initial }: Props) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const form = new FormData(e.currentTarget);
    const body = {
      slug: String(form.get("slug")),
      nameEn: String(form.get("nameEn")),
      nameSi: String(form.get("nameSi") || "") || undefined,
      nameTa: String(form.get("nameTa") || "") || undefined,
      descriptionEn: String(form.get("descriptionEn")),
      descriptionSi: String(form.get("descriptionSi") || "") || undefined,
      descriptionTa: String(form.get("descriptionTa") || "") || undefined,
      estimatedMinutes: Number(form.get("estimatedMinutes") || 15),
      sortOrder: Number(form.get("sortOrder") || 0),
      priceAmount: Number(form.get("priceAmount")),
      currency: String(form.get("currency") || "LKR"),
      isActive: form.get("isActive") === "on",
      supportedLanguages: ["en", "si", "ta"],
    };

    try {
      if (initial) {
        await apiRequest(`/admin/products/${initial.id}`, {
          method: "PATCH",
          token,
          body,
        });
      } else {
        await apiRequest("/admin/products", { token, body });
      }
      router.push("/admin/products");
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Save failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="mt-6 space-y-4" onSubmit={onSubmit}>
      <Field label="Slug" name="slug" required defaultValue={initial?.slug ?? ""} />
      <Field label="Name (EN)" name="nameEn" required defaultValue={initial?.nameEn ?? ""} />
      <Field label="Name (SI)" name="nameSi" defaultValue={initial?.nameSi ?? ""} />
      <Field label="Name (TA)" name="nameTa" defaultValue={initial?.nameTa ?? ""} />
      <label className="block space-y-1.5">
        <span className="text-sm text-muted">Description (EN)</span>
        <textarea
          name="descriptionEn"
          required
          rows={3}
          defaultValue={initial?.descriptionEn ?? ""}
          className="w-full rounded-xl border border-line bg-[var(--input-bg)] px-3.5 py-2.5 text-ink outline-none focus:border-[var(--accent-hover)]"
        />
      </label>
      <label className="block space-y-1.5">
        <span className="text-sm text-muted">Description (SI)</span>
        <textarea
          name="descriptionSi"
          rows={2}
          defaultValue={initial?.descriptionSi ?? ""}
          className="w-full rounded-xl border border-line bg-[var(--input-bg)] px-3.5 py-2.5 text-ink outline-none focus:border-[var(--accent-hover)]"
        />
      </label>
      <label className="block space-y-1.5">
        <span className="text-sm text-muted">Description (TA)</span>
        <textarea
          name="descriptionTa"
          rows={2}
          defaultValue={initial?.descriptionTa ?? ""}
          className="w-full rounded-xl border border-line bg-[var(--input-bg)] px-3.5 py-2.5 text-ink outline-none focus:border-[var(--accent-hover)]"
        />
      </label>
      <div className="grid gap-4 sm:grid-cols-3">
        <Field
          label="Price (LKR)"
          name="priceAmount"
          type="number"
          min={0}
          step="0.01"
          required
          defaultValue={initial?.price?.amount ?? 1490}
        />
        <Field
          label="Est. minutes"
          name="estimatedMinutes"
          type="number"
          min={1}
          defaultValue={initial?.estimatedMinutes ?? 15}
        />
        <Field
          label="Sort order"
          name="sortOrder"
          type="number"
          defaultValue={initial?.sortOrder ?? 0}
        />
      </div>
      <input type="hidden" name="currency" value="LKR" />
      <label className="flex items-center gap-2 text-sm text-ink">
        <input
          type="checkbox"
          name="isActive"
          defaultChecked={initial?.isActive !== false}
          className="size-4 accent-[var(--accent)]"
        />
        Active in shop
      </label>
      {error ? <p className="text-sm text-[var(--danger)]">{error}</p> : null}
      <Button type="submit" disabled={busy}>
        {busy ? "Saving…" : initial ? "Update product" : "Create product"}
      </Button>
    </form>
  );
}
