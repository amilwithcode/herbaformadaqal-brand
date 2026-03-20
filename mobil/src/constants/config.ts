import Constants from "expo-constants";

/**
 * API əsas URL – Next.js layihəsinin canlı və ya lokal serveri
 * .env faylında EXPO_PUBLIC_API_URL ilə override edə bilərsiniz
 */
const extra = (Constants.expoConfig as any)?.extra;
export const API_BASE_URL =
  extra?.apiUrl ||
  (typeof process !== "undefined" && (process as any).env?.EXPO_PUBLIC_API_URL) ||
  "https://your-domain.com";

export const LOCALES = ["az", "en", "tr", "ru"] as const;
export type Locale = (typeof LOCALES)[number];
