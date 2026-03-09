/**
 * Meta/OG şəkil URL-ini Google və sosial şəbəkələr üçün həmişə absolute URL et.
 * Nisbi path (/uploads/...) və ya boş olarsa siteUrl əsasında düzəldir.
 */
export function ensureAbsoluteImageUrl(
  imageUrl: string | null | undefined,
  siteUrl: string
): string {
  if (!imageUrl || !imageUrl.trim()) return "";
  const trimmed = imageUrl.trim();
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }
  if (trimmed.startsWith("/")) {
    return `${siteUrl.replace(/\/$/, "")}${trimmed}`;
  }
  return `${siteUrl.replace(/\/$/, "")}/${trimmed}`;
}
