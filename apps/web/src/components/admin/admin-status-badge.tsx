export function AdminStatusBadge({ status }: { status: string }) {
  const tone =
    status === "COMPLETED" || status === "READY" || status === "ACTIVE" || status === "CONFIRMED"
      ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-200"
      : status === "FAILED" || status === "BLOCKED" || status === "CANCELLED" || status === "REJECTED"
        ? "border-[var(--danger)]/40 bg-[var(--danger)]/10 text-[var(--danger)]"
        : status === "PAYMENT_UNDER_REVIEW" || status === "UNDER_REVIEW" || status === "GENERATING"
          ? "border-amber-400/40 bg-amber-400/10 text-amber-100"
          : "border-line bg-[var(--input-bg)] text-muted";

  return (
    <span className={`inline-flex rounded-lg border px-2 py-0.5 text-xs font-medium ${tone}`}>
      {status.replaceAll("_", " ")}
    </span>
  );
}
