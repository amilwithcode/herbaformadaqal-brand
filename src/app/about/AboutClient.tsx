"use client";

import { useI18n } from "@/contexts/I18nContext";
import CountUp from "@/components/ui/CountUp";
import ProductCard from "@/components/products/ProductCard";
import type { Product } from "@/modules/products/types";

type Props = {
  initialAboutContent: string;
  initialProducts: Product[];
};

export default function AboutClient({ initialAboutContent, initialProducts }: Props) {
  const { t, locale } = useI18n();

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

      {initialAboutContent && (
        <section className="space-y-4 text-sm md:text-base text-emerald-800 whitespace-pre-wrap">
          <p>{initialAboutContent}</p>
        </section>
      )}

      <section className="space-y-6">
        <h2 className="text-center text-xl font-semibold text-emerald-950">
          {t("about.values.title")}
        </h2>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-3xl border border-emerald-100 bg-white px-6 py-6 text-center text-sm text-emerald-900">
            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-[#e4f3ec] text-emerald-700">
              &#10003;
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
              &#10003;
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
              &#10084;
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
              &#9432;
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

      {initialProducts.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-center text-xl font-semibold text-emerald-950">
            {t("about.recommended.title")}
          </h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {initialProducts.map((product) => {
              const titleTrans = product.translations?.find(
                (tr) => tr.language === locale && tr.field === "title"
              );
              const anyTitle = product.translations?.find(
                (tr) => tr.field === "title"
              );
              const title =
                titleTrans?.value ||
                anyTitle?.value ||
                t("home.product_fallback");
              const finalPrice =
                Number(product.base_price) *
                (1 - Number(product.discount_percent) / 100);

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
        </section>
      )}
    </main>
  );
}
