import { type ReactNode } from "react";

export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={`glass-card p-5 md:p-6 ${className}`}>{children}</div>;
}
