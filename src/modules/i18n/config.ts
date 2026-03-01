export const locales = ["az", "ru", "en", "tr"] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "az";

