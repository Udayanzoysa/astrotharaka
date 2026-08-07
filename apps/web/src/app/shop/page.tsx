"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { apiRequest } from "@/lib/api";
import {
  packageName,
  productDescription,
  productName,
  type Product,
  type SubscriptionPackage,
  type UserSubscription,
} from "@/lib/types";
import { useAuth } from "@/components/providers/auth-provider";
import { useUi } from "@/components/providers/ui-provider";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function ShopPage() {
  const { t, language } = useUi();
  const { token, user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [packages, setPackages] = useState<SubscriptionPackage[]>([]);
  const [mine, setMine] = useState<UserSubscription | null>(null);
  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  useEffect(() => {
    void (async () => {
      try {
        const [productData, packageData] = await Promise.all([
          apiRequest<Product[]>("/products"),
          apiRequest<SubscriptionPackage[]>("/subscriptions/packages"),
        ]);
        setProducts(productData);
        setPackages(packageData);
        if (token) {
          const sub = await apiRequest<UserSubscription | null>("/subscriptions/me", { token });
          setMine(sub);
        } else {
          setMine(null);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not load shop");
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  const hasActive = !!mine && mine.status === "ACTIVE";

  const upgradePackages = useMemo(() => {
    if (!hasActive || !mine) return packages;
    return packages.filter(
      (pkg) =>
        pkg.priceLkr > mine.priceLkr ||
        pkg.sortOrder > (packages.find((p) => p.id === mine.packageId)?.sortOrder ?? 0),
    );
  }, [hasActive, mine, packages]);

  const isTopPlan = hasActive && upgradePackages.length === 0;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 md:px-6 md:py-12">
      <h1 className="font-heading fade-up text-3xl text-ink">{t("availableServices")}</h1>
      <p className="mt-2 max-w-2xl text-muted">{t("disclaimer")}</p>

      {error ? (
        <p className="mt-4 rounded-xl border border-[var(--danger)]/40 bg-[color-mix(in_srgb,var(--danger)_8%,transparent)] px-4 py-3 text-sm text-[var(--danger)]">
          {error}
        </p>
      ) : null}

      {hasActive ? (
        <Card className="fade-up mt-6 border-accent/30">
          <p className="text-sm uppercase tracking-[0.14em] text-accent">{t("subscriptionActive")}</p>
          <h2 className="mt-1 font-heading text-xl text-ink">
            {language === "si" && mine?.packageNameSi ? mine.packageNameSi : mine?.packageNameEn}
          </h2>
          <p className="mt-2 text-sm text-muted">
            {t("quotaBabyNames")}: {mine?.babyNamesRemaining}/{mine?.babyNamesQuota} ·{" "}
            {t("quotaPorondam")}: {mine?.porondamRemaining}/{mine?.porondamQuota} ·{" "}
            {t("quotaHoroscope")}: {mine?.horoscopeRemaining}/{mine?.horoscopeQuota}
          </p>
          <p className="mt-1 text-xs text-muted">
            {t("subscriptionExpires")}:{" "}
            {mine ? new Date(mine.expiresAt).toLocaleDateString() : "—"}
          </p>
          <p className="mt-4 text-sm text-muted">{t("shopUseQuotaHint")}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link href="/#home-report">
              <Button variant="ghost">{t("quotaHoroscope")}</Button>
            </Link>
            <Link href="/baby-names">
              <Button variant="ghost">{t("serviceBabyNames")}</Button>
            </Link>
            <Link href="/porondam">
              <Button variant="ghost">{t("servicePorondam")}</Button>
            </Link>
            <Link href="/dream-interpretation">
              <Button variant="ghost">{t("serviceDream")}</Button>
            </Link>
          </div>
        </Card>
      ) : null}

      {loading ? <p className="mt-8 text-muted">Loading…</p> : null}

      {/* One-time products: only for users without an active subscription */}
      {!hasActive ? (
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {products.map((product, index) => (
            <Card key={product.id} className={`fade-up fade-up-delay-${Math.min(index, 3)}`}>
              <h2 className="font-heading text-xl text-accent">{productName(product, language)}</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                {productDescription(product, language)}
              </p>
              <p className="mt-4 text-sm text-muted">
                {t("estimatedTime")}: {product.estimatedMinutes} {t("minutes")}
              </p>
              <p className="mt-1 font-heading text-lg text-ink">
                {product.price
                  ? `${product.price.currency} ${product.price.amount.toLocaleString()}`
                  : "—"}
              </p>
              <Link href={`/shop/${product.slug}`} className="mt-5 inline-block">
                <Button>{t("buyNow")}</Button>
              </Link>
            </Card>
          ))}
        </div>
      ) : null}

      {/* Packages: subscribe if none; upgrade only if a higher plan exists */}
      <div className="mt-12">
        <h2 className="font-heading text-2xl text-ink">
          {hasActive
            ? isTopPlan
              ? t("shopTopPlan")
              : t("shopUpgradeOptions")
            : t("serviceSubscription")}
        </h2>
        {!isTopPlan ? (
          <p className="mt-1 text-sm text-muted">
            {hasActive ? t("shopUpgradeHint") : t("serviceSubscriptionDesc")}
          </p>
        ) : null}

        {!user ? (
          <p className="mt-4 text-sm text-muted">
            <Link href="/login?next=/shop" className="text-accent hover:underline">
              {t("subscriptionLogin")}
            </Link>
          </p>
        ) : null}

        {!isTopPlan ? (
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {(hasActive ? upgradePackages : packages).map((pkg) => (
              <Card key={pkg.id}>
                <h3 className="font-heading text-lg text-accent">{packageName(pkg, language)}</h3>
                <p className="mt-1 text-2xl font-semibold text-ink">
                  LKR {pkg.priceLkr.toLocaleString()}
                  <span className="text-sm font-normal text-muted"> / {pkg.durationDays}d</span>
                </p>
                <ul className="mt-3 space-y-1 text-sm text-muted">
                  <li>
                    {t("quotaBabyNames")}: {pkg.babyNamesQuota}
                  </li>
                  <li>
                    {t("quotaPorondam")}: {pkg.porondamQuota}
                  </li>
                  <li>
                    {t("quotaHoroscope")}: {pkg.horoscopeQuota}
                  </li>
                </ul>
                <Link href="/subscription" className="mt-5 inline-block">
                  <Button>{hasActive ? t("shopUpgradeCta") : t("subscriptionSubscribe")}</Button>
                </Link>
              </Card>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}
