import type { Metadata } from "next";
import { searchProducts, getCategories } from "@/modules/products/queries";
import ProductsClient from "@/components/products/ProductsClient";
import HomeFooter from "@/components/home/HomeFooter";
import SiteNavbar from "@/components/layout/SiteNavbar";
import { getSupabaseServerClient } from "@/lib/supabase-server";
import { buildPageMetadata } from "@/lib/build-page-metadata";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return buildPageMetadata({
    locale,
    pageKey: "search",
    canonicalPath: "/search",
    fallbackTitle: "Axtarış",
    fallbackDescription: "Məhsul axtarışı nəticələri.",
  });
}

/**
 * Middleware /search -> /{locale}/search yönləndirdikdə 404 olmaması üçün.
 */
export default async function LocaleSearchPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ q?: string }>;
}) {
  const { locale } = await params;
  const { q: query = "" } = await searchParams;
  const supabase = await getSupabaseServerClient();

  const [products, categories, settingsResult] = await Promise.all([
    searchProducts(query || ""),
    getCategories(locale),
    supabase
      .from("site_settings")
      .select("public_site_name, site_name, logo, footer_phone")
      .eq("id", 1)
      .maybeSingle(),
  ]);

  const settings = settingsResult.data;

  return (
    <div className="min-h-screen bg-[#f5faf7] text-emerald-950">
      <SiteNavbar initialSettings={settings} />
      <main className="mx-auto max-w-6xl space-y-6 px-6 py-10">
        <h1 className="text-2xl font-bold text-emerald-900">
          Axtarış nəticələri: &quot;{query}&quot;
        </h1>
        <ProductsClient products={products} categories={categories} />
      </main>
      <HomeFooter />
    </div>
  );
}
