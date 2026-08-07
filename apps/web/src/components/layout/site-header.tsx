"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { useUi } from "@/components/providers/ui-provider";
import { usePreviewConsumed } from "@/hooks/use-preview-consumed";
import type { Language } from "@/lib/types";

type NavItem = { href: string; label: string; accent?: boolean };

const BRAND_LOGO = "/brand/taraka-nav-clear.png";

const LANG_OPTIONS = [
  { code: "en" as const, short: "EN", name: "English" },
  { code: "si" as const, short: "සි", name: "Sinhala" },
  { code: "ta" as const, short: "த", name: "Tamil" },
];

/** One shared header text class — same size for brand, nav, login, register */
const NAV_TEXT = "nav-text";

function SunIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.6" />
      <path
        d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5.1 5.1l1.6 1.6M17.3 17.3l1.6 1.6M18.9 5.1l-1.6 1.6M6.7 17.3l-1.6 1.6"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

function StarsIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 3.2l1.1 3.4 3.5.1-2.8 2.2 1 3.4L12 10.5 8.2 12.3l1-3.4-2.8-2.2 3.5-.1L12 3.2z"
        fill="currentColor"
        opacity="0.95"
      />
      <path d="M18.5 14.2l.6 1.8 1.9.1-1.5 1.2.5 1.8-1.5-1.1-1.5 1.1.5-1.8-1.5-1.2 1.9-.1.6-1.8z" fill="currentColor" />
      <path d="M5.2 15l.45 1.35 1.4.05-1.1.9.4 1.35-1.15-.85-1.15.85.4-1.35-1.1-.9 1.4-.05L5.2 15z" fill="currentColor" opacity="0.8" />
    </svg>
  );
}

function GlobeIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="8.25" stroke="currentColor" strokeWidth="1.5" />
      <path d="M4 12h16M12 4c2.4 2.4 3.6 5.1 3.6 8s-1.2 5.6-3.6 8c-2.4-2.4-3.6-5.1-3.6-8s1.2-5.6 3.6-8z" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

function NavLink({
  item,
  pathname,
  onClick,
}: {
  item: NavItem;
  pathname: string | null;
  onClick?: () => void;
}) {
  const active =
    item.href === "/#home-report"
      ? false
      : pathname === item.href || (item.href !== "/" && pathname?.startsWith(item.href));

  return (
    <Link
      href={item.href}
      onClick={onClick}
      className={`rounded-lg px-3 py-2 ${NAV_TEXT} transition ${
        active
          ? "bg-[color-mix(in_srgb,var(--accent)_16%,transparent)] text-accent"
          : item.accent
            ? "text-accent hover:bg-[color-mix(in_srgb,var(--accent)_10%,transparent)]"
            : "text-muted hover:bg-[var(--input-bg)] hover:text-ink"
      }`}
    >
      {item.label}
    </Link>
  );
}

function NavDropdown({
  label,
  items,
  pathname,
}: {
  label: string;
  items: NavItem[];
  pathname: string | null;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const anyActive = items.some(
    (item) => item.href !== "/#home-report" && (pathname === item.href || pathname?.startsWith(item.href)),
  );

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 ${NAV_TEXT} transition ${
          anyActive || open
            ? "bg-[color-mix(in_srgb,var(--accent)_14%,transparent)] text-accent"
            : "text-muted hover:bg-[var(--input-bg)] hover:text-ink"
        }`}
      >
        {label}
        <svg className="h-5 w-5 opacity-70" viewBox="0 0 12 12" fill="none" aria-hidden>
          <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
      </button>
      {open ? (
        <div className="absolute left-0 top-[calc(100%+6px)] z-50 min-w-[13.5rem] rounded-xl border border-line bg-[color-mix(in_srgb,var(--bg)_94%,transparent)] p-1.5 shadow-lg backdrop-blur-md">
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className={`block rounded-lg px-3 py-2.5 ${NAV_TEXT} transition ${
                pathname === item.href || (item.href !== "/#home-report" && pathname?.startsWith(item.href))
                  ? "bg-[color-mix(in_srgb,var(--accent)_14%,transparent)] text-accent"
                  : "text-muted hover:bg-[var(--input-bg)] hover:text-ink"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function SiteHeader() {
  const pathname = usePathname();
  const { t, language, setLanguage, theme, setTheme } = useUi();
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const previewUsed = usePreviewConsumed();

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  if (pathname?.startsWith("/admin")) {
    return null;
  }

  // Guests who still have free preview → "Free preview"; after that (or logged in) → Hadahana / Horoscope
  const horoscopeLabel = previewUsed ? t("navHadahana") : t("guestReport");

  const services: NavItem[] = [
    { href: "/#home-report", label: horoscopeLabel, accent: true },
    { href: "/baby-names", label: t("babyNames") },
    { href: "/porondam", label: t("porondam") },
    { href: "/dream-interpretation", label: t("dreamInterpretation") },
    { href: "/shop", label: t("availableServices") },
  ];

  const account: NavItem[] = user
    ? [
        { href: "/my-reports", label: t("myReports") },
        { href: "/orders", label: t("orders") },
        { href: "/subscription", label: t("subscription") },
        { href: "/birth-profiles", label: t("birthProfiles") },
        { href: "/settings", label: t("settings") },
      ]
    : [
        { href: "/my-reports", label: t("myReports") },
        { href: "/subscription", label: t("subscription") },
      ];

  const isStaff =
    !!user && ["CONTENT", "SUPER_ADMIN", "SUPPORT", "FINANCE"].includes(user.role);

  return (
    <header className="site-header sticky top-0 z-40 border-b border-[var(--nav-border)] bg-[color-mix(in_srgb,var(--bg)_78%,transparent)] backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-7xl items-center gap-3 px-3 sm:h-16 sm:px-5 md:px-6">
        {/* Brand — clear transparent mark (no plate/bg) */}
        <Link
          href={user ? "/dashboard" : "/"}
          className="flex min-w-0 shrink-0 items-center gap-2.5"
        >
          <Image
            src={BRAND_LOGO}
            alt="Taraka"
            width={40}
            height={40}
            sizes="40px"
            quality={70}
            priority
            className={`h-9 w-9 object-contain bg-transparent sm:h-10 sm:w-10 ${
              theme === "dark" ? "mix-blend-screen" : ""
            }`}
          />
          <span className={`truncate font-semibold tracking-wide text-accent ${NAV_TEXT}`}>
            තාරකා
          </span>
        </Link>

        {/* Desktop categorized nav */}
        <nav className="ml-2 hidden min-w-0 flex-1 items-center gap-1 lg:flex">
          <NavDropdown label={t("navServices")} items={services} pathname={pathname} />
          <span className="mx-1.5 h-5 w-px bg-[var(--border)] opacity-60" aria-hidden />
          <NavDropdown label={t("navAccount")} items={account} pathname={pathname} />
          {isStaff ? (
            <>
              <span className="mx-1.5 h-5 w-px bg-[var(--border)] opacity-60" aria-hidden />
              <NavLink item={{ href: "/admin", label: t("admin"), accent: true }} pathname={pathname} />
            </>
          ) : null}
        </nav>

        <div className="ml-auto flex shrink-0 items-center gap-1.5 sm:gap-2">
          {/* Compact language */}
          <div
            className="flex items-center gap-0.5 rounded-full px-1 py-0.5"
            role="group"
            aria-label={t("language")}
          >
            <GlobeIcon className="mr-0.5 hidden h-4 w-4 text-muted sm:block" />
            {LANG_OPTIONS.map(({ code, short, name }) => (
              <button
                key={code}
                type="button"
                aria-label={`${name} ${short}`}
                aria-pressed={language === code}
                onClick={() => setLanguage(code as Language)}
                className={`min-h-8 min-w-8 rounded-full px-1.5 text-xs font-medium transition sm:min-h-9 sm:min-w-9 sm:text-sm ${
                  language === code
                    ? "btn-on-accent"
                    : "text-muted hover:text-ink"
                }`}
              >
                {short}
              </button>
            ))}
          </div>

          {/* Theme — icon only, no box */}
          <button
            type="button"
            aria-label={t("theme")}
            title={theme === "dark" ? t("light") : t("dark")}
            className="inline-flex h-10 w-10 items-center justify-center text-accent transition hover:scale-105 hover:text-ink"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          >
            {theme === "dark" ? (
              <SunIcon className="h-5 w-5 sm:h-6 sm:w-6" />
            ) : (
              <StarsIcon className="h-5 w-5 sm:h-6 sm:w-6" />
            )}
          </button>

          {/* Auth */}
          {user ? (
            <button
              type="button"
              onClick={logout}
              className={`hidden rounded-lg px-3 py-2 text-muted transition hover:text-ink sm:inline-flex ${NAV_TEXT}`}
            >
              {t("logout")}
            </button>
          ) : (
            <div className="hidden items-center gap-1.5 sm:flex">
              <Link
                href="/login"
                className={`rounded-lg px-2.5 py-1.5 text-muted transition hover:text-ink ${NAV_TEXT}`}
              >
                {t("login")}
              </Link>
              <Link
                href="/register"
                className={`btn-on-accent inline-flex min-h-9 items-center justify-center rounded-lg px-3.5 py-1.5 font-medium transition hover:brightness-110 ${NAV_TEXT}`}
              >
                {t("register")}
              </Link>
            </div>
          )}

          {/* Mobile menu */}
          <button
            type="button"
            aria-label="Menu"
            aria-expanded={mobileOpen}
            className="inline-flex h-9 w-9 items-center justify-center text-muted hover:text-ink lg:hidden"
            onClick={() => setMobileOpen((v) => !v)}
          >
            {mobileOpen ? (
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
              </svg>
            ) : (
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile panel */}
      {mobileOpen ? (
        <div className="border-t border-line bg-[color-mix(in_srgb,var(--bg)_94%,transparent)] px-4 py-4 backdrop-blur-xl lg:hidden">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">
            {t("navServices")}
          </p>
          <div className="mb-4 flex flex-col gap-0.5">
            {services.map((item) => (
              <NavLink key={item.href} item={item} pathname={pathname} onClick={() => setMobileOpen(false)} />
            ))}
          </div>
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">
            {t("navAccount")}
          </p>
          <div className="mb-4 flex flex-col gap-0.5">
            {account.map((item) => (
              <NavLink key={item.href} item={item} pathname={pathname} onClick={() => setMobileOpen(false)} />
            ))}
            {isStaff ? (
              <NavLink
                item={{ href: "/admin", label: t("admin"), accent: true }}
                pathname={pathname}
                onClick={() => setMobileOpen(false)}
              />
            ) : null}
          </div>
          <div className="border-t border-line pt-3">
            {user ? (
              <button
                type="button"
                className={`w-full rounded-lg px-2.5 py-2 text-left text-muted hover:text-ink ${NAV_TEXT}`}
                onClick={() => {
                  logout();
                  setMobileOpen(false);
                }}
              >
                {t("logout")}
              </button>
            ) : (
              <div className="flex gap-2">
                <Link
                  href="/login"
                  className={`flex flex-1 items-center justify-center rounded-lg border border-[color:var(--accent-hover)] px-3 py-2 text-ink ${NAV_TEXT}`}
                  onClick={() => setMobileOpen(false)}
                >
                  {t("login")}
                </Link>
                <Link
                  href="/register"
                  className={`btn-on-accent flex flex-1 items-center justify-center rounded-lg px-3 py-2 font-medium ${NAV_TEXT}`}
                  onClick={() => setMobileOpen(false)}
                >
                  {t("register")}
                </Link>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </header>
  );
}
