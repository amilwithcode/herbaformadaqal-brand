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

export async function getHeroSlides() {
  const supabase = await getSupabaseServerClient();
  const { data } = await supabase
    .from("hero_slides")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });
  return data || [];
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
