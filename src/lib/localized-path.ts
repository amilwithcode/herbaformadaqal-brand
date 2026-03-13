import { locales, type Locale } from "@/modules/i18n/config";

/**
 * Path artıq dil prefiksi ilə başlayırsa (məs. /en/products) true
 */
export function pathHasLocalePrefix(path: string): boolean {
  const segment = path.replace(/^\/+/, "").split("/")[0] || "";
  return locales.includes(segment as Locale);
}

/**
 * Path-dən dil prefiksini çıxarır: /en/products -> /products, /az -> /
 */
export function getPathWithoutLocale(path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  if (!pathHasLocalePrefix(normalized)) return normalized;
  const rest = normalized.replace(/^\/[a-z]{2}/, "") || "/";
  return rest || "/";
}

/**
 * Daxili linklər üçün cari dilə uyğun path qaytarır.
 * /api və /admin üçün prefiks əlavə etmir.
 */
export function getLocalizedPath(path: string, locale: Locale): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  if (
    normalized.startsWith("/api") ||
    normalized.startsWith("/admin") ||
    normalized.startsWith("/auth") ||
    normalized.startsWith("/account")
  ) {
    return normalized;
  }
  if (pathHasLocalePrefix(normalized)) {
    return normalized;
  }
  return `/${locale}${normalized}`;
}
