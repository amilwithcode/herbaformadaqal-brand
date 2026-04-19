import { Suspense } from "react";
import { getBrowseProducts, getCategories } from "@/modules/products/queries";
import { getSiteSettings } from "@/modules/settings/queries";
import ProductsHeader from "@/components/products/ProductsHeader";
import ProductsClient from "@/components/products/ProductsClient";
import HomeFooter from "@/components/home/HomeFooter";
import SiteNavbar from "@/components/layout/SiteNavbar";
import { getSupabaseServerClient } from "@/lib/supabase-server";

export const revalidate = 60;

export default async function ProductsPage() {
  const supabase = await getSupabaseServerClient();
  const [products, categories, settings] = await Promise.all([
    getBrowseProducts(),
    getCategories(),
    getSiteSettings(),
  ]);

  return (
    <div className="min-h-screen bg-[#f5faf7] text-emerald-950">
      <SiteNavbar initialSettings={settings} />
      <main className="mx-auto max-w-6xl px-4 sm:px-6 py-8 sm:py-10 space-y-6">
        <ProductsHeader />
        <Suspense fallback={<div className="h-96 flex items-center justify-center">Məhsullar yüklənir...</div>}>
          <ProductsClient products={products} categories={categories} />
        </Suspense>
      </main>
      <HomeFooter />
    </div>
  );
}
