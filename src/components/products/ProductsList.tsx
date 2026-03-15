"use client";

import { useMemo, useState } from "react";
import ProductCard from "./ProductCard";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useI18n } from "@/contexts/I18nContext";

type SliderProduct = {
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

type ProductsListProps = {
  products: SliderProduct[];
  viewMode: "grid" | "list";
};

export default function ProductsList({ products, viewMode }: ProductsListProps) {
  const { t } = useI18n();
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  const totalPages = Math.ceil(products.length / itemsPerPage);
  const safePage = useMemo(() => {
    const maxPage = Math.max(totalPages, 1);
    return Math.min(Math.max(1, currentPage), maxPage);
  }, [currentPage, totalPages]);
  const currentProducts = useMemo(() => {
    return products.slice(
      (safePage - 1) * itemsPerPage,
      safePage * itemsPerPage
    );
  }, [products, safePage]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 100, behavior: "smooth" });
  };

  if (!products.length) {
    return (
      <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-emerald-200 bg-emerald-50/50 p-12 text-center">
        <div className="text-4xl mb-4">🔍</div>
        <h3 className="text-lg font-medium text-emerald-900">{t("products.not_found")}</h3>
        <p className="text-emerald-600 mt-1">{t("products.not_found_hint")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div
        className={`grid gap-3 sm:gap-4 md:gap-6 ${
          viewMode === "grid"
            ? "grid-cols-1 min-[480px]:grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
            : "grid-cols-1 md:grid-cols-2"
        }`}
      >
        {currentProducts.map((p, idx) => (
          <ProductCard
            key={p.id}
            id={p.id}
            name={p.name}
            price={p.price}
            originalPrice={p.originalPrice}
            tag={p.tag ?? (idx === 0 ? "popular" : idx === 1 ? "new" : null)}
            imageUrl={p.imageUrl}
            slug={p.slug}
            rating={p.rating}
            reviewCount={p.reviewCount}
          />
        ))}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 border-t border-emerald-100 pt-8">
          <button
            onClick={() => handlePageChange(safePage - 1)}
            disabled={safePage === 1}
            className="flex h-11 w-11 items-center justify-center rounded-full border border-emerald-100 bg-white text-emerald-700 shadow-sm transition-all hover:bg-emerald-50 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
            aria-label={t("products.prev_page")}
          >
            <ChevronLeft size={20} />
          </button>

          <div className="flex items-center gap-2">
            {Array.from({ length: totalPages }).map((_, i) => {
              const page = i + 1;
              // Show first, last, current, and surrounding pages
              if (
                page === 1 ||
                page === totalPages ||
                (page >= safePage - 1 && page <= safePage + 1)
              ) {
                return (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-medium transition-all ${
                      safePage === page
                        ? "bg-emerald-600 text-white shadow-md"
                        : "bg-transparent text-emerald-600 hover:bg-emerald-50"
                    }`}
                  >
                    {page}
                  </button>
                );
              } else if (
                (page === safePage - 2 && page > 1) ||
                (page === safePage + 2 && page < totalPages)
              ) {
                return (
                  <span key={page} className="text-emerald-300">
                    ...
                  </span>
                );
              }
              return null;
            })}
          </div>

          <button
            onClick={() => handlePageChange(safePage + 1)}
            disabled={safePage === totalPages}
            className="flex h-11 w-11 items-center justify-center rounded-full border border-emerald-100 bg-white text-emerald-700 shadow-sm transition-all hover:bg-emerald-50 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
            aria-label={t("products.next_page")}
          >
            <ChevronRight size={20} />
          </button>
        </div>
      )}
    </div>
  );
}
