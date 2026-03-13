"use client";

import { useI18n } from "@/contexts/I18nContext";
import { LocalizedLink } from "@/components/navigation/LocalizedLink";
import ProductCard from "@/components/products/ProductCard";
import SiteNavbar from "@/components/layout/SiteNavbar";
import HomeFooter from "@/components/home/HomeFooter";

type Category = {
  id: number;
  name: string;
  slug: string;
  description?: string | null;
};

type Product = {
  id: number;
  base_price: number;
  discount_percent: number;
  image_url: string | null;
  slug: string;
  rating_average?: number;
  review_count?: number;
  translations?: { field: string; value: string }[];
};

type Props = {
  category: Category;
  products: Product[];
  settings: { public_site_name?: string; site_name?: string; logo?: string; footer_phone?: string } | null;
};

export default function CategoryPageContent({ category, products, settings }: Props) {
  const { t } = useI18n();
  const categoryName = category.name || category.slug.split("-").map((s: string) => s.charAt(0).toUpperCase() + s.slice(1)).join(" ");

  return (
    <div className="min-h-screen bg-[#f5faf7] text-emerald-950">
      <SiteNavbar initialSettings={settings} />
      <main className="mx-auto max-w-6xl px-6 py-10 space-y-8">
        <div className="space-y-2">
          <nav className="text-xs text-emerald-700">
            <LocalizedLink href="/" className="hover:underline">{t("nav.home")}</LocalizedLink>
            <span className="mx-1">/</span>
            <LocalizedLink href="/products" className="hover:underline">{t("nav.products")}</LocalizedLink>
            <span className="mx-1">/</span>
            <span className="font-medium">{categoryName}</span>
          </nav>
          <h1 className="text-3xl md:text-4xl font-semibold text-emerald-950">{categoryName}</h1>
          {category.description && (
            <p className="text-sm text-emerald-700 max-w-2xl">{category.description}</p>
          )}
        </div>
        {products.length === 0 ? (
          <div className="rounded-2xl border border-emerald-100 bg-white p-8 text-center">
            <p className="text-emerald-700">{t("categories.no_products")}</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:gap-6">
            {products.map((product) => {
              const basePrice = Number(product.base_price) || 0;
              const discount = Number(product.discount_percent) || 0;
              const finalPrice = basePrice * (1 - discount / 100);
              const title = product.translations?.find((tr) => tr.field === "title")?.value || product.slug?.split("-").map((s: string) => s.charAt(0).toUpperCase() + s.slice(1)).join(" ") || t("categories.product_fallback");
              return (
                <ProductCard
                  key={product.id}
                  id={product.id}
                  name={title}
                  price={finalPrice}
                  originalPrice={discount > 0 ? basePrice : null}
                  imageUrl={product.image_url}
                  slug={product.slug}
                  rating={product.rating_average}
                  reviewCount={product.review_count}
                />
              );
            })}
          </div>
        )}
      </main>
      <HomeFooter />
    </div>
  );
}
