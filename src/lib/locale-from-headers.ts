import { headers } from "next/headers";

const LOCALES = ["az", "en", "tr", "ru"] as const;
const FALLBACK = "en";

function getLocaleFromAcceptLanguage(acceptLanguage: string | null): string {
  if (!acceptLanguage?.trim()) return FALLBACK;
  const parts = acceptLanguage.split(",").map((p) => p.trim().split(";")[0]?.toLowerCase() || "");
  for (const part of parts) {
    const lang = (part.split("-")[0] || part).toLowerCase();
    if (LOCALES.includes(lang as (typeof LOCALES)[number])) return lang;
  }
  return FALLBACK;
}

/** Server component-də Accept-Language-dan dil almaq üçün */
export async function getLocaleFromHeaders(): Promise<string> {
  const headersList = await headers();
  const acceptLanguage = headersList.get("accept-language");
  return getLocaleFromAcceptLanguage(acceptLanguage);
}
