"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { ApiError, apiRequest } from "@/lib/api";
import type { AdminPromotion } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";

type Props = {
  token: string;
  initial?: AdminPromotion | null;
};

function num(v: string | number | null | undefined): string {
  if (v == null || v === "") return "";
  return String(v);
}

export function PromotionForm({ token, initial }: Props) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const form = new FormData(e.currentTarget);
    const minRaw = String(form.get("minOrderAmount") || "");
    const maxRaw = String(form.get("maxRedemptions") || "");
    const startsAt = String(form.get("startsAt") || "");
    const endsAt = String(form.get("endsAt") || "");

    const body = {
      code: String(form.get("code")),
      name: String(form.get("name")),
      discountType: String(form.get("discountType")),
      discountValue: Number(form.get("discountValue")),
      minOrderAmount: minRaw ? Number(minRaw) : undefined,
      maxRedemptions: maxRaw ? Number(maxRaw) : undefined,
      perCustomerLimit: Number(form.get("perCustomerLimit") || 1),
      startsAt: startsAt ? new Date(startsAt).toISOString() : undefined,
      endsAt: endsAt ? new Date(endsAt).toISOString() : undefined,
      isActive: form.get("isActive") === "on",
    };

    try {
      if (initial) {
        await apiRequest(`/admin/promotions/${initial.id}`, {
          method: "PATCH",
          token,
          body,
        });
      } else {
        await apiRequest("/admin/promotions", { token, body });
      }
      router.push("/admin/promotions");
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Save failed");
    } finally {
      setBusy(false);
    }
  }

  const startsDefault = initial?.startsAt
    ? new Date(initial.startsAt).toISOString().slice(0, 16)
    : "";
  const endsDefault = initial?.endsAt
    ? new Date(initial.endsAt).toISOString().slice(0, 16)
    : "";

  return (
    <form className="mt-6 space-y-4" onSubmit={onSubmit}>
      <Field
        label="Code"
        name="code"
        required
        defaultValue={initial?.code ?? ""}
        placeholder="SUMMER20"
      />
      <Field label="Name" name="name" required defaultValue={initial?.name ?? ""} />
      <label className="block space-y-1.5 text-sm">
        <span className="text-muted">Discount type</span>
        <select
          name="discountType"
          defaultValue={initial?.discountType ?? "PERCENT"}
          className="min-h-11 w-full rounded-xl border border-line bg-[var(--input-bg)] px-3 text-ink"
        >
          <option value="PERCENT">Percent (%)</option>
          <option value="FIXED">Fixed amount (LKR)</option>
        </select>
      </label>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label="Discount value"
          name="discountValue"
          type="number"
          min={0}
          step="0.01"
          required
          defaultValue={num(initial?.discountValue) || "10"}
        />
        <Field
          label="Min order amount"
          name="minOrderAmount"
          type="number"
          min={0}
          step="0.01"
          defaultValue={num(initial?.minOrderAmount)}
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label="Per customer limit"
          name="perCustomerLimit"
          type="number"
          min={1}
          defaultValue={initial?.perCustomerLimit ?? 1}
        />
        <Field
          label="Max redemptions (global)"
          name="maxRedemptions"
          type="number"
          min={1}
          defaultValue={num(initial?.maxRedemptions)}
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label="Starts at"
          name="startsAt"
          type="datetime-local"
          defaultValue={startsDefault}
        />
        <Field
          label="Ends at"
          name="endsAt"
          type="datetime-local"
          defaultValue={endsDefault}
        />
      </div>
      <label className="flex items-center gap-2 text-sm text-ink">
        <input
          type="checkbox"
          name="isActive"
          defaultChecked={initial?.isActive !== false}
          className="size-4 accent-[var(--accent)]"
        />
        Active
      </label>
      {error ? <p className="text-sm text-[var(--danger)]">{error}</p> : null}
      <Button type="submit" disabled={busy}>
        {busy ? "Saving…" : initial ? "Update promotion" : "Create promotion"}
      </Button>
    </form>
  );
}
