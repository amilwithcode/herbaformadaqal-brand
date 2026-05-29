import type { Metadata } from "next";
import { getSiteSettings, getMetaTags } from "@/modules/settings/queries";
import { ensureAbsoluteImageUrl } from "@/lib/seo-utils";
import { parseKeywords } from "@/lib/keywords-utils";
import { getSiteUrl } from "@/lib/site-url";

const OG_LOCALE_MAP: Record<string, string> = {
  az: "az_AZ",
  en: "en_US",
  tr: "tr_TR",
  ru: "ru_RU",
};

const LOCALES = ["az", "en", "tr", "ru"] as const;

export type BuildPageMetadataArgs = {
  locale: string;
  /** meta_tags.page dəyəri (admin panel) */
  pageKey: string;
  /**
   * Kanonik path: lokal səhifələr üçün "/products"; auth üçün "/auth/login"
   */
  canonicalPath: string;
  fallbackTitle: string;
  fallbackDescription: string;
  fallbackKeywords?: string;
  /**
   * true: URL-də dil prefiksi yoxdur (middleware /auth, /account)
   */
  omitLocaleInCanonical?: boolean;
};

/**
 * Admin meta_tags + site_settings əsasında Next Metadata (Open Graph, Twitter, canonical).
 */
export async function buildPageMetadata({
  locale,
  pageKey,
  canonicalPath,
  fallbackTitle,
  fallbackDescription,
  fallbackKeywords,
  omitLocaleInCanonical,
}: BuildPageMetadataArgs): Promise<Metadata> {
  const localePath = LOCALES.includes(locale as (typeof LOCALES)[number])
    ? locale
    : "az";

  const [settings, metaTags] = await Promise.all([
    getSiteSettings(),
    getMetaTags(pageKey),
  ]);

  const siteUrl = getSiteUrl();
  const brandName =
    settings?.public_site_name || settings?.site_name || "Herbalife";

  const title = (metaTags?.title?.trim() || fallbackTitle).trim();
  const description = (
    metaTags?.description?.trim() || fallbackDescription
  ).trim();
  const keywordsRaw =
    metaTags?.keywords?.trim() || fallbackKeywords || "";
  const keywords = keywordsRaw ? parseKeywords(keywordsRaw) : [];

  const rawOgImage =
    metaTags?.og_image ||
    metaTags?.image ||
    settings?.logo ||
    `${siteUrl}/og-image.jpg`;
  const ogImage =
    ensureAbsoluteImageUrl(rawOgImage, siteUrl) || `${siteUrl}/og-image.jpg`;

  const path =
    canonicalPath === "/" ? "" : canonicalPath.startsWith("/")
      ? canonicalPath
      : `/${canonicalPath}`;

  const canonical = omitLocaleInCanonical
    ? `${siteUrl}${path === "" ? "" : path}`
    : `${siteUrl}/${localePath}${path}`;

  const ogTitle = metaTags?.og_title?.trim() || title;
  const ogDescription =
    metaTags?.og_description?.trim() || description;

  const alternates: Metadata["alternates"] = omitLocaleInCanonical
    ? { canonical }
    : {
        canonical,
        languages: {
          "x-default": `${siteUrl}/az${path}`,
          az: `${siteUrl}/az${path}`,
          en: `${siteUrl}/en${path}`,
          tr: `${siteUrl}/tr${path}`,
          ru: `${siteUrl}/ru${path}`,
        },
      };

  return {
    title,
    description,
    keywords: keywords.length > 0 ? keywords : undefined,
    openGraph: {
      title: ogTitle,
      description: ogDescription,
      url: canonical,
      siteName: brandName,
      images: [{ url: ogImage, width: 1200, height: 630, alt: ogTitle }],
      locale: OG_LOCALE_MAP[localePath] || "az_AZ",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: ogTitle,
      description: ogDescription,
      images: [ogImage],
    },
    alternates,
  };
}
