import { notFound } from "next/navigation";
import { getCategoryBySlug, getProductsByCategory } from "@/modules/products/queries";
import ProductCard from "@/components/products/ProductCard";
import SiteNavbar from "@/components/layout/SiteNavbar";
import HomeFooter from "@/components/home/HomeFooter";
import { getSupabaseServerClient } from "@/lib/supabase-server";

export const revalidate = 60;

type Props = {
  params: Promise<{ slug: string }>;
};

export default async function CategoryPage({ params }: Props) {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);

  if (!category) {
    notFound();
  }

  // Ensure category has name
  const categoryName = category.name || category.slug.split("-").map((s: string) => s.charAt(0).toUpperCase() + s.slice(1)).join(" ");

  const supabase = await getSupabaseServerClient();
  const [products, settingsResult] = await Promise.all([
    getProductsByCategory(category.id),
    supabase.from("site_settings").select("public_site_name, site_name, logo, footer_phone").eq("id", 1).maybeSingle(),
  ]);

  const settings = settingsResult.data;

  return (
    <div className="min-h-screen bg-[#f5faf7] text-emerald-950">
      <SiteNavbar initialSettings={settings} />
      <main className="mx-auto max-w-6xl px-6 py-10 space-y-8">
        <div className="space-y-2">
          <nav className="text-xs text-emerald-700">
            <a href="/" className="hover:underline">Ana səhifə</a>
            <span className="mx-1">/</span>
            <a href="/products" className="hover:underline">Məhsullar</a>
            <span className="mx-1">/</span>
            <span className="font-medium">{categoryName}</span>
          </nav>
          <h1 className="text-3xl md:text-4xl font-semibold text-emerald-950">
            {categoryName}
          </h1>
          {category.description && (
            <p className="text-sm text-emerald-700 max-w-2xl">
              {category.description}
            </p>
          )}
        </div>

        {products.length === 0 ? (
          <div className="rounded-2xl border border-emerald-100 bg-white p-8 text-center">
            <p className="text-emerald-700">Bu kateqoriyada hələlik məhsul yoxdur.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:gap-6">
            {products.map((product) => {
              const basePrice = Number(product.base_price) || 0;
              const discount = Number(product.discount_percent) || 0;
              const finalPrice = basePrice * (1 - discount / 100);
              const title = product.translations?.find(t => t.field === "title")?.value || product.slug?.split("-").map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(" ") || "Məhsul";
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
