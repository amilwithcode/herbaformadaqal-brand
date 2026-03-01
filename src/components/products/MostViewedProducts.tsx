"use client";

import ProductCard from "./ProductCard";
import type { Product } from "@/modules/products/types";
import { useI18n } from "@/contexts/I18nContext";

type MostViewedProductsProps = {
  products: Product[];
};

export default function MostViewedProducts({ products }: MostViewedProductsProps) {
  const { locale, t } = useI18n();

  if (!products || products.length === 0) return null;

  return (
    <section className="mx-auto max-w-7xl px-4 py-10">
      <div className="flex items-center gap-3 mb-6">
        <div className="h-8 w-1.5 bg-emerald-600 rounded-full" />
        <h2 className="text-xl md:text-2xl font-semibold text-slate-900">
          {t("products.most_viewed")}
        </h2>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {products.map((p) => {
          const basePrice = Number(p.base_price) || 0;
          const discount = Number(p.discount_percent) || 0;
          const finalPrice = basePrice * (1 - discount / 100);

          // Get translated name
          const titleTrans = p.translations?.find(
            (t) => t.language === locale && t.field === "title"
          );
          const name =
            titleTrans?.value ||
            p.slug
              ?.split("-")
              .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
              .join(" ") ||
            "Məhsul";

          return (
            <ProductCard
              key={p.id}
              id={p.id}
              name={name}
              price={finalPrice}
              originalPrice={discount > 0 ? basePrice : null}
              imageUrl={p.image_url}
              slug={p.slug}
              rating={p.rating_average || 0}
              reviewCount={p.review_count || 0}
            />
          );
        })}
      </div>
    </section>
  );
}
