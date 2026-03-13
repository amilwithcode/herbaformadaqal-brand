import { getSupabaseServerClient } from "@/lib/supabase-server";

export async function getSiteSettings() {
  const supabase = await getSupabaseServerClient();
  const { data } = await supabase
    .from("site_settings")
    .select("public_site_name, site_name, logo, footer_phone, primary_color, hide_prices, hide_points")
    .eq("id", 1)
    .maybeSingle();
  return data;
}

const HERO_LOCALES = ["az", "en", "tr", "ru"] as const;

export async function getHeroSlides(locale?: string) {
  const supabase = await getSupabaseServerClient();
  const safeLocale = locale && (HERO_LOCALES as readonly string[]).includes(locale) ? locale : "az";
  const { data, error } = await supabase
    .from("hero_slides")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  if (error) return [];
  const rows = data || [];
  if (rows.length === 0) return [];

  const hasLocale = rows[0] && "locale" in rows[0];
  if (hasLocale) {
    const byLocale = rows.filter((r: { locale?: string }) => r.locale === safeLocale);
    if (byLocale.length > 0) return byLocale;
    const azRows = rows.filter((r: { locale?: string }) => r.locale === "az");
    return azRows.length > 0 ? azRows : rows;
  }
  return rows;
}

export async function getPageSections(pageSlug: string) {
  const supabase = await getSupabaseServerClient();
  const { data } = await supabase
    .from("page_sections")
    .select("section_key, content")
    .eq("page_slug", pageSlug);
  
  const sections: Record<string, any> = {};
  if (data) {
    data.forEach((row) => {
      sections[row.section_key] = row.content;
    });
  }
  return sections;
}

export async function getMetaTags(page: string) {
  const supabase = await getSupabaseServerClient();
  const { data } = await supabase
    .from("meta_tags")
    .select("*")
    .eq("page", page)
    .maybeSingle();
  return data;
}
