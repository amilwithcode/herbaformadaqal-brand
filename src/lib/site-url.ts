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

export function shouldEnableAdSense(host: string | null | undefined): boolean {
  return isProductionHost(host);
}
