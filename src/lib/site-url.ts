/** Canlı saytın əsas URL-i (sonunda / olmadan). */
export const DEFAULT_SITE_URL = "https://www.herbaformadaqal.com";

/** Google AdSense nəşriyyatçı ID (ca-pub-… → ads.txt-də pub-…). */
export const ADSENSE_PUBLISHER_ID = "ca-pub-6351848176041276";

/** AdSense yalnız bu hostlarda aktiv olmalıdır (preview/staging-də səhv ad request-lərinin qarşısını alır). */
export const PRODUCTION_HOSTS = [
  "www.herbaformadaqal.com",
  "herbaformadaqal.com",
] as const;

export function getSiteUrl(): string {
  const raw = process.env.NEXT_PUBLIC_SITE_URL || DEFAULT_SITE_URL;
  return raw.replace(/\/$/, "");
}

export function normalizeHost(host: string): string {
  return host.toLowerCase().split(":")[0];
}

export function isProductionHost(host: string | null | undefined): boolean {
  if (!host) return false;
  return PRODUCTION_HOSTS.includes(
    normalizeHost(host) as (typeof PRODUCTION_HOSTS)[number]
  );
}

/**
 * AdSense-i aktivləşdirmək üçün şərt.
 * - Əvvəlcə NEXT_PUBLIC_FORCE_ADSENSE env varsa (1/true) → həmişə aktiv
 * - Production hostlar → aktiv
 * - Development rejimi → aktiv (local test üçün)
 * - Vercel preview (*.vercel.app) → aktiv (test üçün)
 */
export function shouldEnableAdSense(host: string | null | undefined): boolean {
  const forceEnable =
    process.env.NEXT_PUBLIC_FORCE_ADSENSE === "1" ||
    process.env.NEXT_PUBLIC_FORCE_ADSENSE === "true";
  if (forceEnable) return true;

  const isNodeDev = process.env.NODE_ENV === "development";
  const h = normalizeHost(host || "");
  const isVercelPreview = h.endsWith(".vercel.app");
  const isLocal =
    h === "localhost" ||
    h === "127.0.0.1" ||
    h === "[::1]" ||
    h.startsWith("192.168.") ||
    h.startsWith("10.") ||
    h.startsWith("172.");

  return (
    isProductionHost(host) ||
    isNodeDev ||
    isVercelPreview ||
    isLocal
  );
}
