import type { Metadata } from "next";
import { getBrowseProducts, getCategories } from "@/modules/products/queries";
import { getSiteSettings } from "@/modules/settings/queries";
import ProductsHeader from "@/components/products/ProductsHeader";
import ProductsClient from "@/components/products/ProductsClient";
import HomeFooter from "@/components/home/HomeFooter";
import SiteNavbar from "@/components/layout/SiteNavbar";
import { getSupabaseServerClient } from "@/lib/supabase-server";
import { buildPageMetadata } from "@/lib/build-page-metadata";

export const revalidate = 60;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return buildPageMetadata({
    locale,
    pageKey: "products",
    canonicalPath: "/products",
    fallbackTitle: "Məhsullar",
    fallbackDescription:
      "Herbalife məhsulları — qidalanma, arıqlama və sağlamlıq üçün. Bütün məhsullar bir yerdə.",
    fallbackKeywords:
      "herbalife məhsulları, protein, çəki idarəsi, vitamin, azərbaycan",
  });
}

export default async function ProductsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const supabase = await getSupabaseServerClient();
  const [products, categories, settings] = await Promise.all([
    getBrowseProducts(),
    getCategories(locale),
    getSiteSettings(),
  ]);

  return (
    <div className="min-h-screen bg-[#f5faf7] text-emerald-950">
      <SiteNavbar initialSettings={settings} />
      <main className="mx-auto max-w-6xl px-4 sm:px-6 py-8 sm:py-10 space-y-6">
        <ProductsHeader />
        <ProductsClient products={products} categories={categories} />
      </main>
      <HomeFooter />
    </div>
  );
}
