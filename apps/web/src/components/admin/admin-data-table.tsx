"use client";

import { type ReactNode, useMemo } from "react";
import { Button } from "@/components/ui/button";

export const ADMIN_PAGE_SIZE_OPTIONS = [10, 20, 50, 100] as const;

export type AdminTableColumn<T> = {
  id: string;
  header: ReactNode;
  cell: (row: T) => ReactNode;
  className?: string;
  headerClassName?: string;
};

type BulkAction = {
  id: string;
  label: string;
  onClick: (selectedIds: string[]) => void | Promise<void>;
  disabled?: boolean;
  variant?: "primary" | "ghost";
};

type Props<T extends { id: string }> = {
  columns: AdminTableColumn<T>[];
  rows: T[];
  total: number;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  selectedIds?: string[];
  onSelectedIdsChange?: (ids: string[]) => void;
  bulkActions?: BulkAction[];
  busy?: boolean;
  emptyMessage?: string;
  getRowId?: (row: T) => string;
};

export function AdminDataTable<T extends { id: string }>({
  columns,
  rows,
  total,
  page,
  pageSize,
  onPageChange,
  onPageSizeChange,
  selectedIds,
  onSelectedIdsChange,
  bulkActions = [],
  busy = false,
  emptyMessage = "No records found.",
  getRowId = (row) => row.id,
}: Props<T>) {
  const selectable = Boolean(onSelectedIdsChange);
  const selected = selectedIds ?? [];
  const rowIds = useMemo(() => rows.map(getRowId), [rows, getRowId]);
  const allSelected = selectable && rowIds.length > 0 && rowIds.every((id) => selected.includes(id));
  const someSelected = selectable && selected.length > 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize) || 1);

  function toggleAll() {
    if (!onSelectedIdsChange) return;
    if (allSelected) {
      onSelectedIdsChange(selected.filter((id) => !rowIds.includes(id)));
      return;
    }
    const merged = new Set([...selected, ...rowIds]);
    onSelectedIdsChange([...merged]);
  }

  function toggleOne(id: string) {
    if (!onSelectedIdsChange) return;
    if (selected.includes(id)) {
      onSelectedIdsChange(selected.filter((x) => x !== id));
      return;
    }
    onSelectedIdsChange([...selected, id]);
  }

  return (
    <div className="space-y-3">
      {selectable && someSelected ? (
        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-line bg-[var(--input-bg)] px-3 py-2">
          <span className="text-sm text-muted">{selected.length} selected</span>
          {bulkActions.map((action) => (
            <Button
              key={action.id}
              type="button"
              variant={action.variant ?? "ghost"}
              disabled={busy || action.disabled}
              onClick={() => void action.onClick(selected)}
            >
              {action.label}
            </Button>
          ))}
          <Button type="button" variant="ghost" disabled={busy} onClick={() => onSelectedIdsChange?.([])}>
            Clear
          </Button>
        </div>
      ) : null}

      <div className="overflow-x-auto rounded-2xl border border-line">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-line bg-[var(--input-bg)] text-xs uppercase tracking-wide text-muted">
            <tr>
              {selectable ? (
                <th className="w-10 px-3 py-3">
                  <input
                    type="checkbox"
                    aria-label="Select all"
                    checked={allSelected}
                    disabled={busy || rows.length === 0}
                    onChange={toggleAll}
                  />
                </th>
              ) : null}
              {columns.map((col) => (
                <th key={col.id} className={`px-3 py-3 ${col.headerClassName ?? ""}`}>
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const id = getRowId(row);
              return (
                <tr key={id} className="border-b border-line/70 hover:bg-[var(--input-bg)]/50">
                  {selectable ? (
                    <td className="px-3 py-3">
                      <input
                        type="checkbox"
                        aria-label={`Select ${id}`}
                        checked={selected.includes(id)}
                        disabled={busy}
                        onChange={() => toggleOne(id)}
                      />
                    </td>
                  ) : null}
                  {columns.map((col) => (
                    <td key={col.id} className={`px-3 py-3 ${col.className ?? ""}`}>
                      {col.cell(row)}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
        {rows.length === 0 ? <p className="p-4 text-sm text-muted">{emptyMessage}</p> : null}
      </div>

      <div className="flex flex-wrap items-center gap-3 text-sm text-muted">
        <span>
          Page {page} of {totalPages} · {total} total
        </span>
        <label className="inline-flex items-center gap-2">
          Rows per page
          <select
            className="min-h-9 rounded-lg border border-line bg-[var(--input-bg)] px-2 text-ink"
            value={pageSize}
            disabled={busy}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
          >
            {ADMIN_PAGE_SIZE_OPTIONS.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>
        <Button
          type="button"
          variant="ghost"
          disabled={busy || page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          Prev
        </Button>
        <Button
          type="button"
          variant="ghost"
          disabled={busy || page >= totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
