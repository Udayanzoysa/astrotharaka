"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { useUi } from "@/components/providers/ui-provider";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const { t } = useUi();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, user, router]);

  if (loading || !user) {
    return <div className="mx-auto max-w-7xl px-4 py-16 text-muted">Loading…</div>;
  }

  const services = [
    {
      href: "/#home-report",
      title: t("serviceHoroscope"),
      desc: t("serviceHoroscopeDesc"),
      delay: "",
    },
    {
      href: "/baby-names",
      title: t("serviceBabyNames"),
      desc: t("serviceBabyNamesDesc"),
      delay: "fade-up-delay-1",
    },
    {
      href: "/porondam",
      title: t("servicePorondam"),
      desc: t("servicePorondamDesc"),
      delay: "fade-up-delay-2",
    },
    {
      href: "/dream-interpretation",
      title: t("serviceDream"),
      desc: t("serviceDreamDesc"),
      delay: "fade-up-delay-3",
    },
    {
      href: "/subscription",
      title: t("serviceSubscription"),
      desc: t("serviceSubscriptionDesc"),
      delay: "fade-up-delay-3",
    },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 md:px-6 md:py-12">
      <div className="fade-up mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.18em] text-accent">{t("dashboard")}</p>
          <h1 className="font-heading mt-2 text-3xl text-ink">
            {t("welcome")}, {user.profile?.fullName ?? user.email}
          </h1>
        </div>
        <Link href="/birth-profiles/new">
          <Button>{t("addBirth")}</Button>
        </Link>
      </div>

      <div className="mb-3">
        <h2 className="font-heading text-lg text-ink">{t("availableServices")}</h2>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {services.map((service) => (
          <Link key={service.href} href={service.href} className="block">
            <Card className={`fade-up h-full transition hover:border-accent/40 ${service.delay}`}>
              <h3 className="font-heading text-lg text-accent">{service.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{service.desc}</p>
            </Card>
          </Link>
        ))}
      </div>

      <Card className="fade-up fade-up-delay-3 mt-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="font-heading text-lg text-ink">{t("birthProfiles")}</h2>
            <p className="text-sm text-muted">{t("birthProfilesHint")}</p>
          </div>
          <div className="flex gap-2">
            <Link href="/birth-profiles">
              <Button variant="ghost">{t("birthProfiles")}</Button>
            </Link>
            <Link href="/settings">
              <Button variant="ghost">{t("settings")}</Button>
            </Link>
          </div>
        </div>
        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
          <Link href="/my-reports">
            <Button>{t("myReports")}</Button>
          </Link>
          <Link href="/shop">
            <Button variant="ghost">{t("shop")}</Button>
          </Link>
          <Link href="/orders">
            <Button variant="ghost">{t("orders")}</Button>
          </Link>
        </div>
        <div className="mt-5 rounded-xl border border-dashed border-line p-4 text-sm text-muted">
          {t("myReportsHint")}
        </div>
      </Card>

      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-[var(--nav-border)] bg-[color-mix(in_srgb,var(--bg)_88%,transparent)] p-3 backdrop-blur-md md:hidden">
        <Link href="/birth-profiles/new">
          <Button fullWidth>{t("addBirth")}</Button>
        </Link>
      </div>
    </div>
  );
}
