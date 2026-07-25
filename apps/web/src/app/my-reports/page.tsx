"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  guestReportPath,
  listSavedGuestReports,
  removeSavedGuestReport,
  type SavedGuestReport,
} from "@/lib/saved-reports";
import { apiRequest } from "@/lib/api";
import type { Order } from "@/lib/types";
import { useAuth } from "@/components/providers/auth-provider";
import { useUi } from "@/components/providers/ui-provider";
import { usePreviewConsumed } from "@/hooks/use-preview-consumed";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function MyReportsPage() {
  const { t } = useUi();
  const { user, token, loading } = useAuth();
  const previewConsumed = usePreviewConsumed();
  const [guestReports, setGuestReports] = useState<SavedGuestReport[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersError, setOrdersError] = useState("");

  useEffect(() => {
    setGuestReports(listSavedGuestReports());
  }, []);

  useEffect(() => {
    if (!token || !user) {
      setOrders([]);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const list = await apiRequest<Order[]>("/orders", { token });
        if (!cancelled) {
          setOrders(list);
          setOrdersError("");
        }
      } catch {
        if (!cancelled) setOrdersError(t("noOrders"));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token, user, t]);

  function onRemoveGuest(tok: string) {
    removeSavedGuestReport(tok);
    setGuestReports(listSavedGuestReports());
  }

  const paidReady = orders.filter(
    (o) => o.status === "COMPLETED" || o.reports?.some((r) => r.status === "READY"),
  );

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 md:py-12">
      <div className="mb-8">
        <p className="text-xs uppercase tracking-[0.18em] text-accent">{t("savedReports")}</p>
        <h1 className="font-heading mt-2 text-3xl text-ink">{t("myReports")}</h1>
        <p className="mt-2 text-sm text-muted">{t("myReportsHint")}</p>
      </div>

      <section className="mb-10">
        <h2 className="font-heading text-lg text-ink">
          {previewConsumed ? t("hadahanaTitle") : t("freePreviews")}
        </h2>
        {guestReports.length === 0 ? (
          <Card className="mt-3">
            <p className="text-sm text-muted">{t("noSavedPreviews")}</p>
            <Link href="/#home-report" className="mt-3 inline-block">
              <Button>
                {previewConsumed ? t("hadahanaGenerateCta") : t("guestGenerateCta")}
              </Button>
            </Link>
          </Card>
        ) : (
          <ul className="mt-3 space-y-3">
            {guestReports.map((r) => (
              <li key={r.token}>
                <Card className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-heading text-ink">
                      {r.title || (previewConsumed ? t("hadahanaTitle") : t("guestReportTitle"))}
                    </p>
                    <p className="text-sm text-muted">
                      {r.fullName || "—"} · {new Date(r.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Link href={guestReportPath(r.token)}>
                      <Button>{t("viewSavedReport")}</Button>
                    </Link>
                    <Button variant="ghost" onClick={() => onRemoveGuest(r.token)}>
                      {t("remove")}
                    </Button>
                  </div>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="font-heading text-lg text-ink">{t("paidReports")}</h2>
        {loading ? (
          <p className="mt-3 text-sm text-muted">Loading…</p>
        ) : !user ? (
          <Card className="mt-3">
            <p className="text-sm text-muted">{t("paidReportsLoginHint")}</p>
            <div className="mt-3 flex gap-2">
              <Link href="/login">
                <Button>{t("login")}</Button>
              </Link>
              <Link href="/orders">
                <Button variant="ghost">{t("orders")}</Button>
              </Link>
            </div>
          </Card>
        ) : paidReady.length === 0 ? (
          <Card className="mt-3">
            <p className="text-sm text-muted">{ordersError || t("noOrders")}</p>
            <Link href="/shop" className="mt-3 inline-block">
              <Button>{t("shop")}</Button>
            </Link>
          </Card>
        ) : (
          <ul className="mt-3 space-y-3">
            {paidReady.map((o) => (
              <li key={o.id}>
                <Card className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-heading text-ink">{o.orderNumber}</p>
                    <p className="text-sm text-muted">{o.status}</p>
                  </div>
                  <Link href={`/orders/${o.id}`}>
                    <Button>{t("viewReport")}</Button>
                  </Link>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
