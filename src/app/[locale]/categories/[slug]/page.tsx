import { notFound } from "next/navigation";
import { getCategoryBySlug, getProductsByCategory } from "@/modules/products/queries";
import { getSupabaseServerClient } from "@/lib/supabase-server";
import CategoryPageContent from "@/components/categories/CategoryPageContent";

export const revalidate = 60;

type Props = {
  params: Promise<{ locale: string; slug: string }>;
};

export default async function CategoryPage({ params }: Props) {
  const { locale, slug } = await params;
  const category = await getCategoryBySlug(slug, locale);
  if (!category) notFound();
  const supabase = await getSupabaseServerClient();
  const [products, settingsResult] = await Promise.all([
    getProductsByCategory(category.id),
    supabase.from("site_settings").select("public_site_name, site_name, logo, footer_phone").eq("id", 1).maybeSingle(),
  ]);
  const settings = settingsResult.data;
  return (
    <CategoryPageContent
      category={category}
      products={products}
      settings={settings}
    />
  );
}
