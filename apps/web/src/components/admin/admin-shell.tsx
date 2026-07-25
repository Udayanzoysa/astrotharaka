"use client";

import { useState, type ReactNode } from "react";
import { AdminSidebar } from "./admin-sidebar";
import { AdminTopbar } from "./admin-topbar";

export function AdminShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-bg text-ink">
      <div className="hidden w-60 shrink-0 md:block lg:w-64">
        <div className="sticky top-0 h-screen">
          <AdminSidebar />
        </div>
      </div>

      {open ? (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/55"
            aria-label="Close menu"
            onClick={() => setOpen(false)}
          />
          <div className="relative h-full w-64 max-w-[80vw]">
            <AdminSidebar onNavigate={() => setOpen(false)} />
          </div>
        </div>
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col">
        <AdminTopbar onMenu={() => setOpen(true)} />
        <div className="flex-1 px-4 py-6 md:px-6 md:py-8">{children}</div>
      </div>
    </div>
  );
}
