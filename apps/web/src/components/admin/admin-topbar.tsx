"use client";

import { usePathname } from "next/navigation";
import { useAuth } from "@/components/providers/auth-provider";
import { Button } from "@/components/ui/button";

const titles: Array<{ match: (p: string) => boolean; title: string }> = [
  { match: (p) => p === "/admin", title: "Dashboard" },
  { match: (p) => p.startsWith("/admin/orders"), title: "Orders" },
  { match: (p) => p.startsWith("/admin/guest-reports"), title: "Guest reports" },
  { match: (p) => p.startsWith("/admin/users"), title: "Users" },
  { match: (p) => p.startsWith("/admin/products"), title: "Products" },
  { match: (p) => p.startsWith("/admin/packages"), title: "Packages" },
  { match: (p) => p.startsWith("/admin/promotions"), title: "Promotions" },
];

export function AdminTopbar({ onMenu }: { onMenu?: () => void }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const title = titles.find((t) => t.match(pathname))?.title ?? "Admin";

  return (
    <header className="flex items-center justify-between gap-3 border-b border-line bg-[color-mix(in_srgb,var(--bg)_85%,transparent)] px-4 py-3 backdrop-blur-md md:px-6">
      <div className="flex min-w-0 items-center gap-3">
        {onMenu ? (
          <button
            type="button"
            onClick={onMenu}
            className="rounded-lg border border-line px-2.5 py-1.5 text-sm text-muted hover:text-ink md:hidden"
            aria-label="Open menu"
          >
            Menu
          </button>
        ) : null}
        <h1 className="truncate font-heading text-lg text-ink md:text-xl">{title}</h1>
      </div>
      <div className="flex shrink-0 items-center gap-2 sm:gap-3">
        <div className="hidden text-right sm:block">
          <p className="text-sm text-ink">{user?.profile?.fullName ?? user?.email}</p>
          <p className="text-xs text-muted">{user?.role}</p>
        </div>
        <Button variant="ghost" onClick={logout}>
          Logout
        </Button>
      </div>
    </header>
  );
}
