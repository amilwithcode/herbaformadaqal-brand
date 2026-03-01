import { defaultLocale, locales, type Locale } from "@/modules/i18n/config";

async function loadMessages(locale: Locale) {
  switch (locale) {
    case "az":
      return (await import("@/modules/i18n/messages/az.json")).default;
    case "ru":
      return (await import("@/modules/i18n/messages/ru.json")).default;
    case "en":
      return (await import("@/modules/i18n/messages/en.json")).default;
    case "tr":
      return (await import("@/modules/i18n/messages/tr.json")).default;
    default:
      return (await import("@/modules/i18n/messages/az.json")).default;
  }
}

export type Messages = Record<string, string>;

export async function getMessages(locale?: string): Promise<Messages> {
  const value = locales.includes(locale as Locale)
    ? (locale as Locale)
    : defaultLocale;
  return loadMessages(value);
}

