"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/components/providers/auth-provider";

type NavLink = {
  href: string;
  label: string;
  match: (p: string) => boolean;
  roles?: readonly string[];
};

const links: NavLink[] = [
  { href: "/admin", label: "Dashboard", match: (p) => p === "/admin" },
  {
    href: "/admin/orders",
    label: "Orders",
    match: (p) => p.startsWith("/admin/orders"),
    roles: ["CONTENT", "SUPER_ADMIN", "SUPPORT", "FINANCE"],
  },
  {
    href: "/admin/guest-reports",
    label: "Guests",
    match: (p) => p.startsWith("/admin/guest-reports"),
    roles: ["CONTENT", "SUPER_ADMIN", "SUPPORT"],
  },
  {
    href: "/admin/users",
    label: "Users",
    match: (p) => p.startsWith("/admin/users"),
    roles: ["CONTENT", "SUPER_ADMIN", "SUPPORT"],
  },
  {
    href: "/admin/products",
    label: "Products",
    match: (p) => p.startsWith("/admin/products"),
    roles: ["CONTENT", "SUPER_ADMIN"],
  },
  {
    href: "/admin/packages",
    label: "Packages",
    match: (p) => p.startsWith("/admin/packages"),
    roles: ["CONTENT", "SUPER_ADMIN"],
  },
  {
    href: "/admin/subscription-payments",
    label: "Subscription payments",
    match: (p) => p.startsWith("/admin/subscription-payments"),
    roles: ["CONTENT", "SUPER_ADMIN", "FINANCE"],
  },
  {
    href: "/admin/promotions",
    label: "Promotions",
    match: (p) => p.startsWith("/admin/promotions"),
    roles: ["CONTENT", "SUPER_ADMIN"],
  },
  {
    href: "/admin/bank-accounts",
    label: "Bank accounts",
    match: (p) => p.startsWith("/admin/bank-accounts"),
    roles: ["CONTENT", "SUPER_ADMIN", "FINANCE"],
  },
  {
    href: "/admin/settings",
    label: "Settings",
    match: (p) => p.startsWith("/admin/settings"),
    roles: ["CONTENT", "SUPER_ADMIN"],
  },
];

export function AdminSidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const { user } = useAuth();
  const role = user?.role ?? "";

  return (
    <aside className="flex h-full flex-col border-r border-line bg-[color-mix(in_srgb,var(--bg)_92%,#13213a)]">
      <div className="flex items-center gap-2.5 border-b border-line px-4 py-4">
        <Image
          src="/brand/taraka-mark.png"
          alt="Taraka"
          width={36}
          height={36}
          className="h-9 w-9 rounded-full object-cover"
        />
        <div className="min-w-0 leading-tight">
          <p className="font-heading text-sm font-semibold text-accent">Taraka Admin</p>
          <p className="truncate text-xs text-muted">තාරකා portal</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {links.map((link) => {
          if (link.roles && !link.roles.includes(role)) return null;
          const active = link.match(pathname);
          return (
            <Link
              key={link.href}
              href={link.href}
              onClick={onNavigate}
              className={`block rounded-xl px-3 py-2.5 text-sm transition ${
                active
                  ? "bg-accent font-medium text-[#0B0F19]"
                  : "text-muted hover:bg-[var(--input-bg)] hover:text-ink"
              }`}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-line p-3">
        <Link
          href="/"
          onClick={onNavigate}
          className="block rounded-xl px-3 py-2.5 text-sm text-muted hover:text-accent"
        >
          ← Back to site
        </Link>
      </div>
    </aside>
  );
}
