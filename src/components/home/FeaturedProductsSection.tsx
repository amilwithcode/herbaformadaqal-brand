"use client";

import { useState, useEffect, useMemo } from "react";
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
  const [searchQuery, setSearchQuery] = useState("");

  // URL-dən search query-ni oxu
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const q = params.get("search") || "";
      setSearchQuery(q);
    }
  }, []);

  // Axtarış nəticələrini filter et
  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) {
      return products;
    }
    const q = searchQuery.toLowerCase().trim();
    return products.filter((p) => {
      const name = p.name?.toLowerCase() || "";
      const slug = p.slug?.toLowerCase() || "";
      return name.includes(q) || slug.includes(q);
    });
  }, [products, searchQuery]);

  // Global search event listener (SiteNavbar-dan gələn axtarış)
  useEffect(() => {
    const handleSearch = (e: CustomEvent<string>) => {
      setSearchQuery(e.detail);
    };
    window.addEventListener("homepage-search" as any, handleSearch as EventListener);
    return () => {
      window.removeEventListener("homepage-search" as any, handleSearch as EventListener);
    };
  }, []);

  return (
    <section className="space-y-5">
      <div className="flex items-baseline justify-between gap-4">
        <div className="flex-1">
          <h2 className="text-lg md:text-xl font-semibold text-emerald-950">
            {t("home.featured.title")}
          </h2>
          {searchQuery && (
            <p className="text-sm text-emerald-700 mt-1">
              {filteredProducts.length} məhsul tapıldı: &quot;{searchQuery}&quot;
            </p>
          )}
        </div>
        <Link
          href="/products"
          className="text-xs md:text-sm font-medium text-emerald-700 hover:text-emerald-900"
        >
          {t("home.featured.view_all")} →
        </Link>
      </div>
      {filteredProducts.length === 0 && searchQuery ? (
        <div className="rounded-2xl border border-emerald-100 bg-white p-8 text-center">
          <p className="text-emerald-700">
            &quot;{searchQuery}&quot; üçün məhsul tapılmadı.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
          {filteredProducts.map((p) => (
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
      )}
    </section>
  );
}
