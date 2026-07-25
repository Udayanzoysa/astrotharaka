"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { ApiError, apiRequest } from "@/lib/api";
import { writeBirthDraft } from "@/lib/birth-draft";
import {
  productDescription,
  productName,
  type BirthProfile,
  type Language,
  type Order,
  type Product,
} from "@/lib/types";
import { useAuth } from "@/components/providers/auth-provider";
import { useUi } from "@/components/providers/ui-provider";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field } from "@/components/ui/field";

type PromoQuote = {
  code: string;
  name: string;
  discountAmount: number;
  totalAmount: number;
};

const ALL_LANGS: Language[] = ["en", "si", "ta"];

export default function ProductDetailPage() {
  const params = useParams<{ slug: string }>();
  const { t, language } = useUi();
  const { token, user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [profiles, setProfiles] = useState<BirthProfile[]>([]);
  const [promoCode, setPromoCode] = useState("");
  const [quote, setQuote] = useState<PromoQuote | null>(null);
  const [reportLanguage, setReportLanguage] = useState<Language>(language);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const supportedLangs = useMemo(() => {
    const list = product?.supportedLanguages?.length ? product.supportedLanguages : ALL_LANGS;
    return ALL_LANGS.filter((l) => list.includes(l));
  }, [product]);

  useEffect(() => {
    void (async () => {
      const data = await apiRequest<Product>(`/products/${params.slug}`);
      setProduct(data);
    })();
  }, [params.slug]);

  useEffect(() => {
    if (!token) return;
    void (async () => {
      const data = await apiRequest<BirthProfile[]>("/birth-profiles", { token });
      setProfiles(data);
    })();
  }, [token]);

  useEffect(() => {
    const preferred = (user?.profile?.preferredLanguage as Language | undefined) ?? language;
    if (supportedLangs.includes(preferred)) {
      setReportLanguage(preferred);
    } else if (supportedLangs.length) {
      setReportLanguage(supportedLangs[0]);
    }
  }, [user, language, supportedLangs]);

  async function applyPromo() {
    if (!token || !product || !promoCode.trim()) return;
    setError("");
    try {
      const data = await apiRequest<PromoQuote>("/promotions/validate", {
        token,
        body: {
          code: promoCode.trim(),
          productId: product.id,
          orderAmount: product.price?.amount,
        },
      });
      setQuote(data);
    } catch (err) {
      setQuote(null);
      setError(err instanceof ApiError ? err.message : "Invalid promo");
    }
  }

  async function onOrder(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!user) {
      router.push(`/login?next=/shop/${params.slug}`);
      return;
    }
    if (!token || !product) return;
    setBusy(true);
    setError("");
    const form = new FormData(e.currentTarget);
    try {
      const order = await apiRequest<Order>("/orders", {
        token,
        body: {
          productId: product.id,
          birthProfileId: String(form.get("birthProfileId")),
          language: reportLanguage,
          promoCode: promoCode.trim() || undefined,
        },
      });
      router.push(`/orders/${order.id}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Order failed");
    } finally {
      setBusy(false);
    }
  }

  if (!product) {
    return <div className="mx-auto max-w-3xl px-4 py-16 text-muted">Loading…</div>;
  }

  const basePrice = product.price?.amount ?? 0;
  const displayTotal = quote?.totalAmount ?? basePrice;
  const langLabel = (code: Language) =>
    code === "si" ? t("langSi") : code === "ta" ? t("langTa") : t("langEn");

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 md:py-12">
      <Link href="/shop" className="text-sm text-muted hover:text-accent">
        ← {t("shop")}
      </Link>
      <Card className="mt-4 fade-up">
        <h1 className="font-heading text-3xl text-accent">{productName(product, language)}</h1>
        <p className="mt-3 leading-relaxed text-muted">{productDescription(product, language)}</p>
        <p className="mt-4 font-heading text-2xl text-ink">
          {product.price ? `${product.price.currency} ${displayTotal.toLocaleString()}` : "—"}
        </p>
        {quote ? (
          <p className="text-sm text-accent">
            {t("discount")}: −{product.price?.currency} {quote.discountAmount.toLocaleString()} (
            {quote.code})
          </p>
        ) : null}
        <p className="text-sm text-muted">
          {t("estimatedTime")}: {product.estimatedMinutes} {t("minutes")}
        </p>

        <form className="mt-8 space-y-4" onSubmit={onOrder}>
          {authLoading ? <p className="text-muted">Loading…</p> : null}
          {user ? (
            <>
              <label className="block space-y-1.5 text-sm">
                <span className="text-muted">{t("selectBirth")}</span>
                <select
                  name="birthProfileId"
                  required
                  className="min-h-11 w-full rounded-xl border border-line bg-[var(--input-bg)] px-3 text-ink"
                  defaultValue=""
                  onChange={(e) => {
                    const selected = profiles.find((p) => p.id === e.target.value);
                    if (!selected) return;
                    const birthTime = selected.birthTime
                      ? String(selected.birthTime).slice(11, 16) ||
                        String(selected.birthTime).slice(0, 5)
                      : undefined;
                    writeBirthDraft({
                      fullName: selected.fullName,
                      birthDate: String(selected.birthDate).slice(0, 10),
                      birthTime: selected.unknownBirthTime ? undefined : birthTime,
                      unknownBirthTime: selected.unknownBirthTime,
                      birthPlaceName: selected.birthPlaceName,
                      latitude: selected.latitude,
                      longitude: selected.longitude,
                      language: reportLanguage,
                      source: "shop",
                    });
                  }}
                >
                  <option value="" disabled>
                    {t("selectBirth")}
                  </option>
                  {profiles.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.fullName} — {p.birthPlaceName}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block space-y-1.5 text-sm">
                <span className="text-muted">{t("reportLanguage")}</span>
                <select
                  name="reportLanguage"
                  required
                  value={reportLanguage}
                  onChange={(e) => setReportLanguage(e.target.value as Language)}
                  className="min-h-11 w-full rounded-xl border border-line bg-[var(--input-bg)] px-3 text-ink"
                >
                  {supportedLangs.map((code) => (
                    <option key={code} value={code}>
                      {langLabel(code)}
                    </option>
                  ))}
                </select>
                <span className="block text-xs text-muted">{t("reportLanguageHint")}</span>
              </label>

              <div className="flex gap-2">
                <div className="flex-1">
                  <Field
                    label={t("promoCode")}
                    name="promoCode"
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value)}
                    placeholder="WELCOME10"
                  />
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  className="mt-7"
                  onClick={() => void applyPromo()}
                >
                  {t("applyPromo")}
                </Button>
              </div>
              <p className="text-xs text-muted">Try WELCOME10 or FLAT500</p>
              {profiles.length === 0 ? (
                <p className="text-sm text-muted">
                  <Link href="/birth-profiles/new" className="text-accent hover:underline">
                    {t("addBirth")}
                  </Link>
                </p>
              ) : null}
            </>
          ) : (
            <p className="text-sm text-muted">
              <Link href="/login" className="text-accent hover:underline">
                {t("login")}
              </Link>{" "}
              {t("buyNow").toLowerCase()}
            </p>
          )}
          {error ? <p className="text-sm text-[var(--danger)]">{error}</p> : null}
          <Button type="submit" disabled={busy || (!!user && profiles.length === 0)}>
            {busy ? t("saving") : t("placeOrder")}
          </Button>
        </form>
      </Card>
    </div>
  );
}
