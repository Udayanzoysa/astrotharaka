"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { ApiError, apiRequest } from "@/lib/api";
import type { SubscriptionPackage } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";

type Props = {
  token: string;
  initial?: SubscriptionPackage | null;
};

export function PackageForm({ token, initial }: Props) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const form = new FormData(e.currentTarget);
    const body = {
      code: String(form.get("code")),
      nameEn: String(form.get("nameEn")),
      nameSi: String(form.get("nameSi") || "") || undefined,
      nameTa: String(form.get("nameTa") || "") || undefined,
      descriptionEn: String(form.get("descriptionEn") || "") || undefined,
      descriptionSi: String(form.get("descriptionSi") || "") || undefined,
      priceLkr: Number(form.get("priceLkr")),
      babyNamesQuota: Number(form.get("babyNamesQuota")),
      porondamQuota: Number(form.get("porondamQuota")),
      horoscopeQuota: Number(form.get("horoscopeQuota")),
      durationDays: Number(form.get("durationDays") || 30),
      sortOrder: Number(form.get("sortOrder") || 0),
      isActive: form.get("isActive") === "on",
    };

    try {
      if (initial) {
        await apiRequest(`/admin/packages/${initial.id}`, {
          method: "PATCH",
          token,
          body,
        });
      } else {
        await apiRequest("/admin/packages", { token, body });
      }
      router.push("/admin/packages");
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Save failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="mt-6 max-w-2xl space-y-4" onSubmit={onSubmit}>
      <Field label="Code" name="code" required defaultValue={initial?.code ?? ""} />
      <Field label="Name (EN)" name="nameEn" required defaultValue={initial?.nameEn ?? ""} />
      <Field label="Name (SI)" name="nameSi" defaultValue={initial?.nameSi ?? ""} />
      <Field label="Name (TA)" name="nameTa" defaultValue={initial?.nameTa ?? ""} />
      <label className="block space-y-1.5">
        <span className="text-sm text-muted">Description (EN)</span>
        <textarea
          name="descriptionEn"
          rows={2}
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
      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label="Monthly price (LKR)"
          name="priceLkr"
          type="number"
          required
          defaultValue={String(initial?.priceLkr ?? 500)}
        />
        <Field
          label="Duration (days)"
          name="durationDays"
          type="number"
          defaultValue={String(initial?.durationDays ?? 30)}
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <Field
          label="Baby names quota"
          name="babyNamesQuota"
          type="number"
          required
          defaultValue={String(initial?.babyNamesQuota ?? 3)}
        />
        <Field
          label="Porondam quota"
          name="porondamQuota"
          type="number"
          required
          defaultValue={String(initial?.porondamQuota ?? 2)}
        />
        <Field
          label="Horoscope quota"
          name="horoscopeQuota"
          type="number"
          required
          defaultValue={String(initial?.horoscopeQuota ?? 2)}
        />
      </div>
      <Field
        label="Sort order"
        name="sortOrder"
        type="number"
        defaultValue={String(initial?.sortOrder ?? 0)}
      />
      <label className="flex items-center gap-2 text-sm text-muted">
        <input
          type="checkbox"
          name="isActive"
          defaultChecked={initial?.isActive ?? true}
          className="rounded border-line"
        />
        Active (visible for new subscriptions)
      </label>
      <p className="text-xs text-muted">
        Editing quotas/price applies to future subscriptions only. Active subscribers keep their
        snapshotted limits.
      </p>
      {error ? <p className="text-sm text-[var(--danger)]">{error}</p> : null}
      <Button type="submit" disabled={busy}>
        {busy ? "Saving…" : initial ? "Update package" : "Create package"}
      </Button>
    </form>
  );
}
