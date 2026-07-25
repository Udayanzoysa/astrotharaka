"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/auth-provider";

export const ADMIN_PORTAL_ROLES = ["CONTENT", "SUPER_ADMIN", "SUPPORT", "FINANCE"] as const;
export const CONTENT_ADMIN_ROLES = ["CONTENT", "SUPER_ADMIN"] as const;
export const ORDER_ADMIN_ROLES = ["CONTENT", "SUPER_ADMIN", "SUPPORT", "FINANCE"] as const;
export const USER_ADMIN_ROLES = ["CONTENT", "SUPER_ADMIN", "SUPPORT"] as const;

type UseAdminAccessOptions = {
  /** Roles allowed for this page. Defaults to all portal staff roles. */
  roles?: readonly string[];
};

export function useAdminAccess(options?: UseAdminAccessOptions) {
  const allowedRoles = options?.roles ?? ADMIN_PORTAL_ROLES;
  const { user, token, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [denied, setDenied] = useState("");

  useEffect(() => {
    if (loading) return;
    if (!user) {
      const next = pathname && pathname !== "/admin/login" ? pathname : "/admin";
      router.replace(`/admin/login?next=${encodeURIComponent(next)}`);
      return;
    }
    if (!ADMIN_PORTAL_ROLES.includes(user.role as (typeof ADMIN_PORTAL_ROLES)[number])) {
      setDenied("Admin access required");
      return;
    }
    if (!allowedRoles.includes(user.role)) {
      setDenied(`This section requires: ${allowedRoles.join(", ")}`);
      return;
    }
    setDenied("");
  }, [user, loading, router, pathname, allowedRoles]);

  const allowed =
    !!user &&
    ADMIN_PORTAL_ROLES.includes(user.role as (typeof ADMIN_PORTAL_ROLES)[number]) &&
    allowedRoles.includes(user.role) &&
    !denied;

  return { user, token, loading, denied, allowed, logout };
}
