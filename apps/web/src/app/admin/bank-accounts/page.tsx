"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { ApiError, apiRequest } from "@/lib/api";
import { ORDER_ADMIN_ROLES, useAdminAccess } from "@/components/admin/use-admin-access";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field } from "@/components/ui/field";

type BankAccount = {
  id: string;
  bankName: string;
  accountHolder: string;
  accountNumber: string;
  branch: string | null;
  isActive: boolean;
  sortOrder: number;
};

const emptyForm = {
  bankName: "",
  accountHolder: "",
  accountNumber: "",
  branch: "",
  sortOrder: "0",
  isActive: true,
};

export default function AdminBankAccountsPage() {
  const { token, loading, denied, allowed } = useAdminAccess({
    roles: ORDER_ADMIN_ROLES,
  });
  const [banks, setBanks] = useState<BankAccount[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function load() {
    if (!token) return;
    try {
      const data = await apiRequest<BankAccount[]>("/admin/bank-accounts", { token });
      setBanks(data);
    } catch {
      setError("Failed to load bank accounts");
    }
  }

  useEffect(() => {
    if (!allowed || !token) return;
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allowed, token]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!token) return;
    setBusy(true);
    setError("");
    const body = {
      bankName: form.bankName.trim(),
      accountHolder: form.accountHolder.trim(),
      accountNumber: form.accountNumber.trim(),
      branch: form.branch.trim() || null,
      sortOrder: Number(form.sortOrder) || 0,
      isActive: form.isActive,
    };
    try {
      if (editingId) {
        await apiRequest(`/admin/bank-accounts/${editingId}`, {
          method: "PATCH",
          token,
          body,
        });
      } else {
        await apiRequest("/admin/bank-accounts", { method: "POST", token, body });
      }
      setForm(emptyForm);
      setEditingId(null);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Save failed");
    } finally {
      setBusy(false);
    }
  }

  function startEdit(bank: BankAccount) {
    setEditingId(bank.id);
    setForm({
      bankName: bank.bankName,
      accountHolder: bank.accountHolder,
      accountNumber: bank.accountNumber,
      branch: bank.branch ?? "",
      sortOrder: String(bank.sortOrder),
      isActive: bank.isActive,
    });
  }

  async function deactivate(id: string) {
    if (!token) return;
    setBusy(true);
    try {
      await apiRequest(`/admin/bank-accounts/${id}`, { method: "DELETE", token });
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Deactivate failed");
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <p className="text-muted">Loading…</p>;
  if (denied) return <p className="text-sm text-[var(--danger)]">{denied}</p>;
  if (!allowed) return null;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-heading text-xl text-ink">Bank accounts</h2>
        <p className="mt-1 text-sm text-muted">
          Customers see these details when paying by bank transfer. Add multiple banks.
        </p>
      </div>

      <Card>
        <form className="grid gap-3 md:grid-cols-2" onSubmit={onSubmit}>
          <Field
            label="Bank name"
            name="bankName"
            value={form.bankName}
            onChange={(e) => setForm((f) => ({ ...f, bankName: e.target.value }))}
            required
          />
          <Field
            label="Account holder"
            name="accountHolder"
            value={form.accountHolder}
            onChange={(e) => setForm((f) => ({ ...f, accountHolder: e.target.value }))}
            required
          />
          <Field
            label="Account number"
            name="accountNumber"
            value={form.accountNumber}
            onChange={(e) => setForm((f) => ({ ...f, accountNumber: e.target.value }))}
            required
          />
          <Field
            label="Branch"
            name="branch"
            value={form.branch}
            onChange={(e) => setForm((f) => ({ ...f, branch: e.target.value }))}
          />
          <Field
            label="Sort order"
            name="sortOrder"
            type="number"
            value={form.sortOrder}
            onChange={(e) => setForm((f) => ({ ...f, sortOrder: e.target.value }))}
          />
          <label className="flex items-end gap-2 pb-2 text-sm text-muted">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
            />
            Active (shown at checkout)
          </label>
          <div className="flex flex-wrap gap-2 md:col-span-2">
            <Button type="submit" disabled={busy}>
              {busy ? "Saving…" : editingId ? "Update bank" : "Add bank"}
            </Button>
            {editingId ? (
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setEditingId(null);
                  setForm(emptyForm);
                }}
              >
                Cancel edit
              </Button>
            ) : null}
          </div>
        </form>
        {error ? <p className="mt-3 text-sm text-[var(--danger)]">{error}</p> : null}
      </Card>

      <div className="space-y-3">
        {banks.map((bank) => (
          <Card key={bank.id}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-heading text-accent">{bank.bankName}</p>
                <p className="mt-1 text-sm text-ink">{bank.accountHolder}</p>
                <p className="text-sm text-muted">
                  {bank.accountNumber}
                  {bank.branch ? ` · ${bank.branch}` : ""}
                </p>
                <p className="mt-1 text-xs text-muted">
                  {bank.isActive ? "Active" : "Inactive"} · sort {bank.sortOrder}
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" onClick={() => startEdit(bank)}>
                  Edit
                </Button>
                {bank.isActive ? (
                  <Button variant="ghost" disabled={busy} onClick={() => void deactivate(bank.id)}>
                    Deactivate
                  </Button>
                ) : null}
              </div>
            </div>
          </Card>
        ))}
        {banks.length === 0 ? (
          <p className="text-sm text-muted">No bank accounts yet. Add your first account above.</p>
        ) : null}
      </div>

      <p className="text-xs text-muted">
        <Link href="/admin/orders" className="text-accent hover:underline">
          Orders
        </Link>{" "}
        — search by payment reference to review slips.
      </p>
    </div>
  );
}
