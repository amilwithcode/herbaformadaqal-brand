"use client";

import { useMemo, useState, useEffect } from "react";
import type { Category, Product } from "@/modules/products/types";
import ProductsFilters from "./ProductsFilters";
import ProductsList from "./ProductsList";
import { useI18n } from "@/contexts/I18nContext";

type ProductsClientProps = {
  products: Product[];
  categories: Category[];
};

export default function ProductsClient({
  products,
  categories,
}: ProductsClientProps) {
  const { t, locale } = useI18n();
  const initialSearch =
    typeof window !== "undefined"
      ? new URLSearchParams(window.location.search).get("search") || ""
      : "";
  const [search, setSearch] = useState(initialSearch);
  const [categoryId, setCategoryId] = useState<number | "all">("all");
  const [sort, setSort] = useState("popular");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // Global search event listener (SiteNavbar-dan gələn axtarış)
  useEffect(() => {
    const handleSearch = (e: CustomEvent<string>) => {
      setSearch(e.detail);
    };
    window.addEventListener("products-search" as any, handleSearch as EventListener);
    return () => {
      window.removeEventListener("products-search" as any, handleSearch as EventListener);
    };
  }, []);

  const categoryOptions = useMemo(
    () =>
      categories.map((c) => {
        const slugLabel =
          c.slug.charAt(0).toUpperCase() +
          c.slug.slice(1).replace(/-/g, " ");
        const key = `categories.${c.slug}`;
        const translated = t(key);
        return {
          id: c.id,
          label: translated === key ? slugLabel : translated,
        };
      }),
    [categories, t]
  );

  const filteredProducts = useMemo(() => {
    let list = products.filter((p) => p.is_active);
    if (categoryId !== "all") {
      list = list.filter((p) => p.category_id === categoryId);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((p) => {
        const normalizedSlug = p.slug.toLowerCase().replace(/-/g, " ");
        const normalizedQuery = q.replace(/-/g, " ");

        // Axtarışı həm slug, həm də tərcümə olunmuş adlar üzrə edək
        const titleTrans = p.translations?.find(
          (tr) => tr.language === locale && tr.field === "title"
        );
        const anyTitle = p.translations?.find(
          (tr) => tr.field === "title"
        );
        const localizedName =
          titleTrans?.value ||
          anyTitle?.value ||
          normalizedSlug;

        return (
          normalizedSlug.includes(normalizedQuery) ||
          p.slug.toLowerCase().includes(q) ||
          localizedName.toLowerCase().includes(q)
        );
      });
    }
    if (sort === "price_low") {
      list = [...list].sort(
        (a, b) => Number(a.base_price) - Number(b.base_price)
      );
    } else if (sort === "price_high") {
      list = [...list].sort(
        (a, b) => Number(b.base_price) - Number(a.base_price)
      );
    }

    return list.map((p) => {
      const price = Number(p.base_price) || 0;
      const discount = Number(p.discount_percent) || 0;
      const finalPrice = price * (1 - discount / 100);

      // Kartlarda dilə uyğun adı göstər
      const titleTrans = p.translations?.find(
        (tr) => tr.language === locale && tr.field === "title"
      );
      const anyTitle = p.translations?.find(
        (tr) => tr.field === "title"
      );
      const name =
        titleTrans?.value ||
        anyTitle?.value ||
        p.slug
          .split("-")
          .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
          .join(" ");

      return {
        id: p.id,
        name,
        price: finalPrice,
        originalPrice: discount ? price : null,
        imageUrl: p.image_url,
        slug: p.slug,
        rating: p.rating_average || 0,
        reviewCount: p.review_count || 0,
      };
    });
  }, [products, categoryId, search, sort, locale]);

  return (
    <div className="space-y-6">
      {search && (
        <div className="rounded-lg bg-emerald-50 border border-emerald-200 px-4 py-2">
          <p className="text-sm text-emerald-900">
            <span className="font-medium">{filteredProducts.length}</span> məhsul tapıldı: &quot;{search}&quot;
          </p>
        </div>
      )}
      <ProductsFilters
        search={search}
        onSearchChange={setSearch}
        categoryId={categoryId}
        onCategoryChange={setCategoryId}
        sort={sort}
        onSortChange={setSort}
        categories={categoryOptions}
        viewMode={viewMode}
        onViewChange={setViewMode}
      />
      {filteredProducts.length === 0 && search ? (
        <div className="rounded-2xl border border-emerald-100 bg-white p-8 text-center">
          <p className="text-emerald-700">
            &quot;{search}&quot; üçün məhsul tapılmadı.
          </p>
        </div>
      ) : (
        <ProductsList products={filteredProducts} viewMode={viewMode} />
      )}
    </div>
  );
}

