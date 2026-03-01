import { notFound } from "next/navigation";
import { Metadata } from "next";
import { getProductBySlug, getMostViewedProducts } from "@/modules/products/queries";
import ProductDetails from "@/components/products/ProductDetails";
import MostViewedProducts from "@/components/products/MostViewedProducts";
import SiteNavbar from "@/components/layout/SiteNavbar";
import HomeFooter from "@/components/home/HomeFooter";
import { getSupabaseServerClient } from "@/lib/supabase-server";

export const revalidate = 60;

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  
  if (!product) {
    return {
      title: "Məhsul tapılmadı",
    };
  }

  // Basic title from slug if translation not available immediately on server
  const title = product.slug.split("-").map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(" ");
  
  return {
    title: `${title} | Herbalife`,
    description: `Buy ${title} from Herbalife`,
  };
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const supabase = await getSupabaseServerClient();
  const [product, settingsResult] = await Promise.all([
    getProductBySlug(slug),
    supabase.from("site_settings").select("public_site_name, site_name, logo, footer_phone").eq("id", 1).maybeSingle(),
  ]);

  const settings = settingsResult.data;

  if (!product) {
    notFound();
  }

  const mostViewedProducts = await getMostViewedProducts(product.id, 8);

  return (
    <div className="min-h-screen bg-[#f5faf7] text-emerald-950 flex flex-col">
      <SiteNavbar initialSettings={settings} />
      <main className="flex-grow">
        <ProductDetails product={product} />
        <MostViewedProducts products={mostViewedProducts} />
      </main>
      <HomeFooter />
    </div>
  );
}