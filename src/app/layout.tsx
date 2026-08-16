import type { Metadata } from "next";
import { cookies, headers } from "next/headers";
import { unstable_cache } from "next/cache";
import { getSupabaseServerClient, getSupabasePublicClient } from "@/lib/supabase-server";
import { ensureAbsoluteImageUrl } from "@/lib/seo-utils";
import { parseKeywords } from "@/lib/keywords-utils";
import {
  ADSENSE_PUBLISHER_ID,
  getSiteUrl,
  shouldEnableAdSense,
} from "@/lib/site-url";
import Script from "next/script";
import SpeedInsightsWrapper from "@/components/common/SpeedInsightsWrapper";
import "./globals.css";
import Providers from "./providers";

const OG_LOCALE_MAP: Record<string, string> = {
  az: "az_AZ",
  en: "en_US",
  tr: "tr_TR",
  ru: "ru_RU",
};

async function getRequestLocale(): Promise<"az" | "en" | "tr" | "ru"> {
  const h = await headers();
  const c = await cookies();
  const locale = h.get("x-locale") || c.get("locale")?.value;
  if (locale === "en" || locale === "tr" || locale === "ru") return locale;
  return "az";
}

/* ─── Ümumi data fetcher (həm metadata, həm layout istifadə edir) ─── */
const getCachedSiteData = unstable_cache(
  async () => {
    const supabase = getSupabasePublicClient();
    const [settingsData, metaData] = await Promise.all([
      supabase
        .from("site_settings")
        .select("public_site_name, site_name, logo, footer_phone, footer_email")
        .eq("id", 1)
        .maybeSingle(),
      supabase
        .from("meta_tags")
        .select("*")
        .eq("page", "home")
        .maybeSingle(),
    ]);
    return {
      settings: settingsData.data,
      meta: metaData.data,
    };
  },
  ["site-settings-meta"],
  { revalidate: 300 }
);

async function getSiteData() {
  return getCachedSiteData();
}

/* ─── Next.js Metadata ─── */
export async function generateMetadata(): Promise<Metadata> {
  const [{ settings, meta }, requestLocale] = await Promise.all([
    getSiteData(),
    getRequestLocale(),
  ]);
  const siteUrl = getSiteUrl();
  const canonicalHome = `${siteUrl}/${requestLocale}`;
  const brandName =
    settings?.public_site_name || settings?.site_name || "Herbalife";
  const publisherName = brandName.includes("Herbalife")
    ? `${brandName} (müstəqil distribütor)`
    : brandName;

  const title =
    meta?.title ||
    settings?.public_site_name ||
    settings?.site_name ||
    "Herbalife - Sağlam Həyat Üçün Məhsullar";
  const description =
    meta?.description ||
    "Herbalife məhsulları ilə sağlam həyat tərzi. Arıqlama, çəki artırma və sağlam qidalanma üçün professional həllər. Azərbaycanda müstəqil Herbalife distribütoru.";
  const keywordsRaw =
    meta?.keywords ||
    "herbalife, sağlamlıq, arıqlama, çəki itirmə, qidalanma, vitamin, əlavə, azərbaycan, bakı, sağlam həyat";
  const keywords = parseKeywords(keywordsRaw);
  const rawOgImage =
    meta?.og_image ||
    meta?.image ||
    settings?.logo ||
    `${siteUrl}/og-image.jpg`;
  const ogImage = ensureAbsoluteImageUrl(rawOgImage, siteUrl) || `${siteUrl}/og-image.jpg`;
  const logoUrl = ensureAbsoluteImageUrl(settings?.logo, siteUrl) || `${siteUrl}/logo.png`;

  return {
    title: {
      default: title,
      template: `%s | ${settings?.public_site_name || "Herbalife"}`,
    },
    description,
    keywords: keywords.length > 0 ? keywords : undefined,
    authors: [{ name: publisherName }],
    creator: publisherName,
    publisher: publisherName,
    metadataBase: new URL(siteUrl),
    alternates: {
      canonical: canonicalHome,
      languages: {
        "x-default": `${siteUrl}/az`,
        az: `${siteUrl}/az`,
        en: `${siteUrl}/en`,
        tr: `${siteUrl}/tr`,
        ru: `${siteUrl}/ru`,
      },
    },
    openGraph: {
      type: "website",
      locale: OG_LOCALE_MAP[requestLocale] || "az_AZ",
      url: canonicalHome,
      siteName: settings?.public_site_name || "Herbalife",
      title: meta?.og_title || title,
      description: meta?.og_description || description,
      images: [{ url: ogImage, width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: "summary_large_image",
      title: meta?.og_title || title,
      description: meta?.og_description || description,
      images: [ogImage],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
    /* ── Google favicon üçün bütün icon növləri ── */
    icons: {
      icon: [
        { url: logoUrl, type: "image/png" },
        { url: logoUrl, sizes: "32x32", type: "image/png" },
        { url: logoUrl, sizes: "192x192", type: "image/png" },
      ],
      shortcut: logoUrl,
      apple: [{ url: logoUrl, sizes: "180x180", type: "image/png" }],
    },
    verification: {
      google: process.env.GOOGLE_VERIFICATION_CODE,
    },
  };
}

/* ─── Root Layout ─── */
export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const [{ settings, meta }, requestLocale, requestHeaders] = await Promise.all([
    getSiteData(),
    getRequestLocale(),
    headers(),
  ]);

  const siteUrl = getSiteUrl();
  const adsenseEnabled = shouldEnableAdSense(requestHeaders.get("host"));
  const siteName =
    settings?.public_site_name || settings?.site_name || "Herbalife";
  const publisherName = siteName.includes("Herbalife")
    ? `${siteName} (müstəqil distribütor)`
    : siteName;
  const logoUrl = settings?.logo || `${siteUrl}/logo.png`;
  const keywordsForMeta = parseKeywords(
    meta?.keywords || "herbalife, sağlamlıq, arıqlama, çəki itirmə, qidalanma, vitamin, əlavə, azərbaycan, bakı, sağlam həyat"
  );
  const keywordsMetaContent = keywordsForMeta.length > 0 ? keywordsForMeta.join(", ") : "";

  /* ── JSON-LD: Google Organization schema (loqo buradan oxunur) ── */
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: siteName,
    description:
      "Müstəqil Herbalife distribütoru. Herbalife şirkətinin rəsmi saytı deyil.",
    url: `${siteUrl}/az`,
    logo: {
      "@type": "ImageObject",
      url: logoUrl,
      width: 512,
      height: 512,
    },
    ...(settings?.footer_phone
      ? { telephone: settings.footer_phone }
      : {}),
    ...(settings?.footer_email
      ? { email: settings.footer_email }
      : {}),
    sameAs: [`${siteUrl}/az`],
  };

  /* ── JSON-LD: WebSite schema (sitelinks searchbox üçün) ── */
  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: siteName,
    url: `${siteUrl}/az`,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${siteUrl}/az/search?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <html lang={requestLocale}>
      <head>
        {/* Açar sözlər: hər biri ayrıca meta keywords-də nəzərə alınır */}
        {keywordsMetaContent ? (
          <meta name="keywords" content={keywordsMetaContent} />
        ) : null}
        {/* Google Search Console — mağazanın sahibliyinin təsdiqi */}
        <meta
          name="google-site-verification"
          content="dxY_YPSfH_pm788aIryoCAjNlbxzyTqmJn5xgvOK3Qs"
        />
        {adsenseEnabled ? (
          <>
            <meta name="google-adsense-account" content={ADSENSE_PUBLISHER_ID} />
            <Script
              id="adsbygoogle-script"
              strategy="beforeInteractive"
              src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_PUBLISHER_ID}`}
              crossOrigin="anonymous"
            />
          </>
        ) : null}
        {/* Google Ads: dil URL-də göstərilir (policy uyğunluğu) */}
        <link rel="alternate" hrefLang="x-default" href={`${siteUrl}/az`} />
        <link rel="alternate" hrefLang="az" href={`${siteUrl}/az`} />
        <link rel="alternate" hrefLang="en" href={`${siteUrl}/en`} />
        <link rel="alternate" hrefLang="tr" href={`${siteUrl}/tr`} />
        <link rel="alternate" hrefLang="ru" href={`${siteUrl}/ru`} />
        {/* DNS Preconnect — xarici ölkələrdən sürətli yüklənmə (Speed Insights / LCP) */}
        <link rel="preconnect" href="https://lhsmlimcxnuzlnpdbnbq.supabase.co" />
        <link rel="dns-prefetch" href="https://lhsmlimcxnuzlnpdbnbq.supabase.co" />
        <link rel="preconnect" href="https://vitals.vercel-insights.com" />
        <link rel="dns-prefetch" href="https://vitals.vercel-insights.com" />
        <link rel="preconnect" href="https://www.googletagmanager.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://www.googletagmanager.com" />
        <link rel="dns-prefetch" href="https://www.googleadservices.com" />
        <link rel="dns-prefetch" href="https://googleads.g.doubleclick.net" />
        {/* Popup CSS — render-blocking olmasın (FCP/LCP yaxşılaşır) */}
        <link rel="stylesheet" href="/popup.css" media="print" id="popup-css" />
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){var l=document.getElementById('popup-css');if(l){l.media='all';}})();`,
          }}
        />
        <noscript><link rel="stylesheet" href="/popup.css" /></noscript>

        {/* ── JSON-LD Structured Data (Google loqo + axtarış) ── */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(organizationSchema),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(websiteSchema),
          }}
        />
      </head>
      <body className="antialiased bg-slate-950 text-slate-100 font-sans">
        <Providers initialLocale={requestLocale}>{children}</Providers>
        {/* Popup üçün cari dil (popup.js dillərə görə mətn göstərir) */}
        <script
          dangerouslySetInnerHTML={{
            __html: `window.__HERBALIFE_LOCALE__="${requestLocale}";`,
          }}
        />
        {/* Popup Script */}
        <Script src="/popup.js" strategy="afterInteractive" />
        {/* Google tag (gtag.js) */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=AW-18011122927"
          strategy="afterInteractive"
        />
        <Script id="google-gtag" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'AW-18011122927', { groups: ['default'] });
          `}
        </Script>
        {/* Vercel Speed Insights */}
        <SpeedInsightsWrapper />
      </body>
    </html>
  );
}
