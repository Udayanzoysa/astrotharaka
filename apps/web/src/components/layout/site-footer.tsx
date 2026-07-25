"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { useUi } from "@/components/providers/ui-provider";

const BRAND_LOGO = "/brand/taraka-nav-clear.png";

type FooterLink = { href: string; labelKey: string };

export function SiteFooter() {
  const pathname = usePathname();
  const { t, language } = useUi();
  const isSi = language === "si";

  if (pathname?.startsWith("/admin")) {
    return null;
  }

  const company: FooterLink[] = [
    { href: "/about", labelKey: "footerAbout" },
    { href: "/contact", labelKey: "footerContact" },
    { href: "/faq", labelKey: "footerFaq" },
    { href: "/shop", labelKey: "availableServices" },
  ];

  const legal: FooterLink[] = [
    { href: "/terms", labelKey: "footerTerms" },
    { href: "/privacy", labelKey: "footerPrivacy" },
    { href: "/refund", labelKey: "footerRefund" },
  ];

  const services: FooterLink[] = [
    { href: "/#home-report", labelKey: "navHadahana" },
    { href: "/baby-names", labelKey: "babyNames" },
    { href: "/porondam", labelKey: "porondam" },
    { href: "/subscription", labelKey: "subscription" },
  ];

  const year = new Date().getFullYear();
  const slogan = isSi ? t("sloganSi") : t("slogan");

  return (
    <footer className="site-footer relative mt-auto border-t border-line/70 bg-[color-mix(in_srgb,var(--bg-card)_42%,transparent)]">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[color-mix(in_srgb,#e8c96a_55%,transparent)] to-transparent"
        aria-hidden
      />
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-14 md:px-8">
        <div className="grid gap-10 md:grid-cols-[1.35fr_repeat(3,minmax(0,1fr))] md:gap-8 lg:gap-12">
          <div className="max-w-sm">
            <Link href="/" className="inline-flex items-center gap-3">
              <Image
                src={BRAND_LOGO}
                alt="Taraka"
                width={48}
                height={48}
                className="h-12 w-12 object-contain"
              />
              <div>
                <p className={`text-base text-ink ${isSi ? "font-sinhala-luxury" : "font-heading"}`}>
                  Taraka · තාරකා
                </p>
                <p className="mt-0.5 text-[11px] uppercase tracking-[0.18em] text-accent/90">
                  Astrology Services
                </p>
              </div>
            </Link>
            <p
              className={`mt-4 text-sm leading-relaxed text-muted ${
                isSi ? "font-sinhala-luxury" : ""
              }`}
            >
              {slogan}
            </p>
            <p className="mt-5 text-sm text-muted">
              <a
                href={`mailto:${t("contactEmailValue")}`}
                className="text-ink underline-offset-4 transition hover:text-accent hover:underline"
              >
                {t("contactEmailValue")}
              </a>
            </p>
          </div>

          <FooterColumn title={t("footerCompany")}>
            {company.map((item) => (
              <FooterNavLink key={item.href} href={item.href} label={t(item.labelKey)} />
            ))}
          </FooterColumn>

          <FooterColumn title={t("footerServices")}>
            {services.map((item) => (
              <FooterNavLink key={item.href} href={item.href} label={t(item.labelKey)} />
            ))}
          </FooterColumn>

          <FooterColumn title={t("footerLegal")}>
            {legal.map((item) => (
              <FooterNavLink key={item.href} href={item.href} label={t(item.labelKey)} />
            ))}
          </FooterColumn>
        </div>

        <div className="mt-10 flex flex-col gap-3 border-t border-line/60 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-muted">
            © {year} Taraka · තාරකා. {t("footerRights")}
          </p>
          <p className="text-xs text-muted">{t("footerTagline")}</p>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <p className="home-section__eyebrow text-accent">{title}</p>
      <ul className="mt-4 space-y-2.5">{children}</ul>
    </div>
  );
}

function FooterNavLink({ href, label }: { href: string; label: string }) {
  return (
    <li>
      <Link
        href={href}
        className="text-sm text-muted transition hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
      >
        {label}
      </Link>
    </li>
  );
}
