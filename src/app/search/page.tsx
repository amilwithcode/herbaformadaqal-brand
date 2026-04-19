import { Suspense } from "react";
import { searchProducts, getCategories } from "@/modules/products/queries";
import ProductsClient from "@/components/products/ProductsClient";
import HomeFooter from "@/components/home/HomeFooter";
import SiteNavbar from "@/components/layout/SiteNavbar";
import { getSupabaseServerClient } from "@/lib/supabase-server";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q: string }>;
}) {
  const { q: query } = await searchParams;
  const supabase = await getSupabaseServerClient();
  
  const [products, categories, settingsResult] = await Promise.all([
    searchProducts(query || ""),
    getCategories(),
    supabase.from("site_settings").select("public_site_name, site_name, logo, footer_phone").eq("id", 1).maybeSingle(),
  ]);

  const settings = settingsResult.data;

  return (
    <div className="min-h-screen bg-[#f5faf7] text-emerald-950">
      <SiteNavbar initialSettings={settings} />
      <main className="mx-auto max-w-6xl px-6 py-10 space-y-6">
        <h1 className="text-2xl font-bold text-emerald-900">
          Axtarış nəticələri: &quot;{query}&quot;
        </h1>
        <Suspense fallback={<div className="h-96 flex items-center justify-center">Axtarılır...</div>}>
          <ProductsClient products={products} categories={categories} />
        </Suspense>
      </main>
      <HomeFooter />
    </div>
  );
}
