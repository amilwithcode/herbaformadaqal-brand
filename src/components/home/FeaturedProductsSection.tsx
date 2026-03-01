"use client";

import Link from "next/link";
import { useI18n } from "@/contexts/I18nContext";
import ProductCard from "@/components/products/ProductCard";

type FeaturedProduct = {
  id: number;
  name: string;
  price: number;
  originalPrice?: number | null;
  tag?: "popular" | "new" | null;
  imageUrl?: string | null;
  slug?: string;
  rating?: number;
  reviewCount?: number;
};

type FeaturedProductsSectionProps = {
  products: FeaturedProduct[];
};

export default function FeaturedProductsSection({
  products,
}: FeaturedProductsSectionProps) {
  const { t } = useI18n();

  return (
    <section className="space-y-5">
      <div className="flex items-baseline justify-between gap-4">
        <h2 className="text-lg md:text-xl font-semibold text-emerald-950">
          {t("home.featured.title")}
        </h2>
        <Link
          href="/products"
          className="text-xs md:text-sm font-medium text-emerald-700 hover:text-emerald-900"
        >
          {t("home.featured.view_all")} →
        </Link>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
        {products.map((p) => (
          <ProductCard
            key={p.id}
            id={p.id}
            name={p.name}
            price={p.price}
            originalPrice={p.originalPrice}
            tag={p.tag}
            imageUrl={p.imageUrl}
            slug={p.slug}
            rating={p.rating}
            reviewCount={p.reviewCount}
          />
        ))}
      </div>
    </section>
  );
}
