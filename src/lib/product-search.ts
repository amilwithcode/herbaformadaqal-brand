import type { Product } from "@/modules/products/types";

/** Tərcümə cədvəlində mətn axtarışı üçün sahələr (bütün dillər) */
const SEARCH_TRANSLATION_FIELDS = new Set(["title", "description", "name"]);

/**
 * Məhsulun bütün dillərdəki ad/təsvir mətnlərini və slug-u birləşdirir (əsas səhifə kartları üçün).
 */
export function productSearchHaystack(
  p: Pick<Product, "slug" | "translations"> & { name?: string | null }
): string {
  const parts: string[] = [];
  if (p.slug) parts.push(p.slug);
  if (p.name) parts.push(p.name);
  for (const tr of p.translations || []) {
    if (SEARCH_TRANSLATION_FIELDS.has(tr.field) && tr.value) parts.push(tr.value);
  }
  return parts.join(" \u0001 ").toLowerCase();
}

/**
 * Client-side məhsul siyahısı: sorğu istənilən dildə olanda uyğun gəlir (bütün tərcümə dəyərləri + slug + name).
 */
export function productMatchesQuery(
  p: Product & { name?: string | null },
  q: string
): boolean {
  const qt = q.toLowerCase().trim();
  if (!qt) return true;
  const qn = qt.replace(/-/g, " ");
  const parts: string[] = [];
  if (p.slug) {
    parts.push(p.slug.toLowerCase());
    parts.push(p.slug.toLowerCase().replace(/-/g, " "));
  }
  if (p.name) parts.push(String(p.name).toLowerCase());
  for (const tr of p.translations || []) {
    if (SEARCH_TRANSLATION_FIELDS.has(tr.field) && tr.value) {
      parts.push(tr.value.toLowerCase());
    }
  }
  return parts.some((h) => h.includes(qt) || h.includes(qn));
}
