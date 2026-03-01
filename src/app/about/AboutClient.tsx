"use client";

import { useEffect, useState } from "react";
import { useI18n } from "@/contexts/I18nContext";
import CountUp from "@/components/ui/CountUp";
import ProductCard from "@/components/products/ProductCard";
import type { Product } from "@/modules/products/types";

export default function AboutClient() {
  const { t, locale } = useI18n();
  const [recommendedProducts, setRecommendedProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [aboutContent, setAboutContent] = useState("");

  useEffect(() => {
    fetch("/api/settings")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && data.about_content) {
          setAboutContent(data.about_content);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    let active = true;
    fetch("/api/products/recommended")
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (!active) return;
        setRecommendedProducts(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        if (!active) return;
        setRecommendedProducts([]);
      })
      .finally(() => {
        if (!active) return;
        setLoadingProducts(false);
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <main className="mx-auto max-w-6xl space-y-10 px-6 py-10">
      <section className="rounded-3xl bg-[#e4f3ec] px-6 py-10 text-center">
        <h1 className="text-3xl md:text-4xl font-semibold text-emerald-950">
          {t("about.hero.title")}
        </h1>
        <p className="mt-2 text-sm md:text-base text-emerald-700">
          {t("about.hero.subtitle")}
        </p>
      </section>
      <section className="space-y-4 text-sm md:text-base text-emerald-800 whitespace-pre-wrap">
        {aboutContent && <p>{aboutContent}</p>}
      </section>
      <section className="space-y-6">
        <h2 className="text-center text-xl font-semibold text-emerald-950">
          {t("about.values.title")}
        </h2>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-3xl border border-emerald-100 bg-white px-6 py-6 text-center text-sm text-emerald-900">
            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-[#e4f3ec] text-emerald-700">
              ✓
            </div>
            <h3 className="mt-3 text-base font-semibold">
              {t("about.values.items.quality.title")}
            </h3>
            <p className="mt-2 text-xs text-emerald-700">
              {t("about.values.items.quality.description")}
            </p>
          </div>
          <div className="rounded-3xl border border-emerald-100 bg-white px-6 py-6 text-center text-sm text-emerald-900">
            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-[#e4f3ec] text-emerald-700">
              ✓
            </div>
            <h3 className="mt-3 text-base font-semibold">
              {t("about.values.items.natural.title")}
            </h3>
            <p className="mt-2 text-xs text-emerald-700">
              {t("about.values.items.natural.description")}
            </p>
          </div>
          <div className="rounded-3xl border border-emerald-100 bg-white px-6 py-6 text-center text-sm text-emerald-900">
            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-[#e4f3ec] text-emerald-700">
              ❤
            </div>
            <h3 className="mt-3 text-base font-semibold">
              {t("about.values.items.care.title")}
            </h3>
            <p className="mt-2 text-xs text-emerald-700">
              {t("about.values.items.care.description")}
            </p>
          </div>
          <div className="rounded-3xl border border-emerald-100 bg-white px-6 py-6 text-center text-sm text-emerald-900">
            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-[#e4f3ec] text-emerald-700">
              ℹ
            </div>
            <h3 className="mt-3 text-base font-semibold">
              {t("about.values.items.guidance.title")}
            </h3>
            <p className="mt-2 text-xs text-emerald-700">
              {t("about.values.items.guidance.description")}
            </p>
          </div>
        </div>
      </section>
      <section className="grid gap-4 rounded-3xl bg-emerald-700 px-6 py-6 text-center text-emerald-50 md:grid-cols-3">
        <div>
          <div className="text-2xl font-semibold">
            <CountUp end={5000} suffix="+" duration={2500} />
          </div>
          <div className="mt-1 text-xs uppercase tracking-[0.16em]">
            {t("about.stats.customers")}
          </div>
        </div>
        <div>
          <div className="text-2xl font-semibold">
            <CountUp end={200} suffix="+" duration={2500} />
          </div>
          <div className="mt-1 text-xs uppercase tracking-[0.16em]">
            {t("about.stats.products")}
          </div>
        </div>
        <div>
          <div className="text-2xl font-semibold">
            <CountUp end={98} suffix="%" duration={2500} />
          </div>
          <div className="mt-1 text-xs uppercase tracking-[0.16em]">
            {t("about.stats.satisfaction")}
          </div>
        </div>
      </section>
      <section className="space-y-4">
        <h2 className="text-center text-xl font-semibold text-emerald-950">
          {t("about.recommended.title")}
        </h2>
        {loadingProducts && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-[300px] animate-pulse rounded-3xl bg-slate-100" />
            ))}
          </div>
        )}
        {!loadingProducts && recommendedProducts.length === 0 && (
          <p className="text-center text-xs text-emerald-700">
            {t("product.not_found")}
          </p>
        )}
        {!loadingProducts && recommendedProducts.length > 0 && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {recommendedProducts.map((product) => {
              const titleTrans = product.translations?.find(
                (tr) => tr.language === locale && tr.field === "title"
              );
              const title = titleTrans?.value || product.slug.split("-").map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(" ");
              const finalPrice = Number(product.base_price) * (1 - Number(product.discount_percent) / 100);
              
              return (
                <ProductCard
                  key={product.id}
                  id={product.id}
                  name={title}
                  price={finalPrice}
                  originalPrice={Number(product.base_price)}
                  tag={product.weight_goal_tag === "loss" ? "popular" : null}
                  imageUrl={product.image_url}
                  slug={product.slug}
                  rating={product.rating_average}
                  reviewCount={product.review_count}
                />
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
