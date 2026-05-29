/** Canlı saytın əsas URL-i (sonunda / olmadan). */
export const DEFAULT_SITE_URL = "https://www.herbaformadaqal.com";

/** Google AdSense nəşriyyatçı ID (ca-pub-… → ads.txt-də pub-…). */
export const ADSENSE_PUBLISHER_ID = "ca-pub-6351848176041276";

export function getSiteUrl(): string {
  const raw = process.env.NEXT_PUBLIC_SITE_URL || DEFAULT_SITE_URL;
  return raw.replace(/\/$/, "");
}
