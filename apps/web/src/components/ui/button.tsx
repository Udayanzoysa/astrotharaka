import { type ButtonHTMLAttributes } from "react";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "ghost";
  fullWidth?: boolean;
};

export function Button({
  variant = "primary",
  fullWidth,
  className = "",
  ...props
}: Props) {
  const base =
    "inline-flex min-h-11 items-center justify-center rounded-xl px-5 py-2.5 text-sm font-semibold transition duration-200 disabled:cursor-not-allowed disabled:opacity-55 font-heading";
  const styles =
    variant === "primary"
      ? "btn-on-accent hover:brightness-110 cta-pulse"
      : "border border-[color:var(--accent-hover)] text-ink hover:bg-[color-mix(in_srgb,var(--accent-hover)_12%,transparent)]";

  return (
    <button
      className={`${base} ${styles} ${fullWidth ? "w-full" : ""} ${className}`}
      {...props}
    />
  );
}
