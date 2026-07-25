export function WarningBanner({
  message,
  compact = false,
}: {
  message: string;
  compact?: boolean;
}) {
  return (
    <div
      role="status"
      className={
        compact
          ? "rounded-lg border px-2.5 py-1.5 text-[11px] leading-snug sm:text-xs"
          : "rounded-xl border px-4 py-3 text-sm leading-relaxed"
      }
      style={{
        background: "var(--warning-bg)",
        borderColor: "var(--warning-border)",
        color: "var(--accent)",
      }}
    >
      {message}
    </div>
  );
}
