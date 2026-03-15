/**
 * Açar sözləri (keywords) vergül, nöqtəli vergül və ya yeni sətir ilə ayrılmış
 * sətirdən massivə çevirir. Boş və artıq boşluqlar silinir.
 * Google və digər axtarış sistemləri üçün hər açar söz ayrıca nəzərə alınır.
 */
const KEYWORD_SEPARATORS = /[,;\n]+/;

export function parseKeywords(raw: string | null | undefined): string[] {
  if (raw == null || typeof raw !== "string") return [];
  const trimmed = raw.trim();
  if (!trimmed) return [];
  return trimmed
    .split(KEYWORD_SEPARATORS)
    .map((k) => k.trim())
    .filter((k) => k.length > 0);
}

/**
 * Saxlama üçün: istifadəçi mətni parse edib yenidən vergüllə birləşdirir.
 * DB-də həmişə "açar söz1, açar söz2" formatı qalır.
 */
export function formatKeywordsForStorage(raw: string | null | undefined): string | null {
  const arr = parseKeywords(raw);
  if (arr.length === 0) return null;
  return arr.join(", ");
}
