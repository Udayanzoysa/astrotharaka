"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiRequest } from "@/lib/api";
import { productName, type Order } from "@/lib/types";
import { useAuth } from "@/components/providers/auth-provider";
import { useUi } from "@/components/providers/ui-provider";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function OrdersPage() {
  const { token, user, loading } = useAuth();
  const { t, language } = useUi();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, user, router]);

  useEffect(() => {
    if (!token) return;
    void (async () => {
      const data = await apiRequest<Order[]>("/orders", { token });
      setOrders(data);
    })();
  }, [token]);

  if (loading || !user) {
    return <div className="mx-auto max-w-3xl px-4 py-16 text-muted">Loading…</div>;
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 md:py-12">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-heading text-2xl text-ink">{t("orders")}</h1>
        <Link href="/shop">
          <Button variant="ghost">{t("shop")}</Button>
        </Link>
      </div>

      {orders.length === 0 ? (
        <Card>
          <p className="text-muted">{t("noOrders")}</p>
          <Link href="/shop" className="mt-4 inline-block">
            <Button>{t("shop")}</Button>
          </Link>
        </Card>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <Card key={order.id}>
              <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="font-heading text-accent">{productName(order.product, language)}</p>
                  <p className="text-sm text-muted">
                    {order.orderNumber} · {order.status}
                  </p>
                  <p className="text-sm text-ink">
                    {order.currency} {order.totalAmount.toLocaleString()}
                  </p>
                </div>
                <Link href={`/orders/${order.id}`}>
                  <Button variant="ghost">{t("orderStatus")}</Button>
                </Link>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
