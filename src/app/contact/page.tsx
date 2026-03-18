import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { defaultLocale, locales, type Locale } from "@/modules/i18n/config";

async function getLocaleForRedirect(): Promise<Locale> {
  const h = await headers();
  const c = await cookies();

  const fromHeader = h.get("x-locale")?.toLowerCase() || "";
  if (locales.includes(fromHeader as Locale)) return fromHeader as Locale;

  const fromCookie = c.get("locale")?.value?.toLowerCase() || "";
  if (locales.includes(fromCookie as Locale)) return fromCookie as Locale;

  return defaultLocale;
}

export default async function ContactRedirectPage() {
  const locale = await getLocaleForRedirect();
  redirect(`/${locale}/contact`);
}
