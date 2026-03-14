import type { Metadata } from "next";
import { Noto_Sans } from "next/font/google";
import { cookies, headers } from "next/headers";
import { getSupabaseServerClient } from "@/lib/supabase-server";
import { ensureAbsoluteImageUrl } from "@/lib/seo-utils";
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

const notoSans = Noto_Sans({
  variable: "--font-noto-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

/* ─── Ümumi data fetcher (həm metadata, həm layout istifadə edir) ─── */
async function getSiteData() {
  const supabase = await getSupabaseServerClient();
  const [settingsData, metaData] = await Promise.all([
    supabase
      .from("site_settings")
      .select("public_site_name, site_name, logo, footer_phone")
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
}

/* ─── Next.js Metadata ─── */
export async function generateMetadata(): Promise<Metadata> {
  const [{ settings, meta }, requestLocale] = await Promise.all([
    getSiteData(),
    getRequestLocale(),
  ]);
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL || "https://www.herbaformadaqal.com";

  const title =
    meta?.title ||
    settings?.public_site_name ||
    settings?.site_name ||
    "Herbalife - Sağlam Həyat Üçün Məhsullar";
  const description =
    meta?.description ||
    "Herbalife məhsulları ilə sağlam həyat tərzi. Arıqlama, çəki artırma və sağlam qidalanma üçün professional həllər. Azərbaycanda rəsmi distribütor.";
  const keywords =
    meta?.keywords ||
    "herbalife, sağlamlıq, arıqlama, çəki itirmə, qidalanma, vitamin, əlavə, azərbaycan, bakı, sağlam həyat";
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
    keywords: keywords.split(",").map((k: string) => k.trim()),
    authors: [{ name: settings?.public_site_name || "Herbalife Distribütor" }],
    creator: settings?.public_site_name || "Herbalife Distribütor",
    publisher: settings?.public_site_name || "Herbalife Distribütor",
    metadataBase: new URL(siteUrl),
    alternates: {
      canonical: siteUrl,
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
      url: siteUrl,
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
  const [{ settings }, requestLocale] = await Promise.all([
    getSiteData(),
    getRequestLocale(),
  ]);

  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL || "https://www.herbaformadaqal.com";
  const siteName =
    settings?.public_site_name || settings?.site_name || "Herbalife";
  const logoUrl = settings?.logo || `${siteUrl}/logo.png`;

  /* ── JSON-LD: Google Organization schema (loqo buradan oxunur) ── */
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: siteName,
    url: siteUrl,
    logo: {
      "@type": "ImageObject",
      url: logoUrl,
      width: 512,
      height: 512,
    },
    sameAs: [siteUrl],
  };

  /* ── JSON-LD: WebSite schema (sitelinks searchbox üçün) ── */
  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: siteName,
    url: siteUrl,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${siteUrl}/search?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <html lang={requestLocale}>
      <head>
        {/* Google Search Console — mağazanın sahibliyinin təsdiqi */}
        <meta
          name="google-site-verification"
          content="dxY_YPSfH_pm788aIryoCAjNlbxzyTqmJn5xgvOK3Qs"
        />
        {/* Google Ads: dil URL-də göstərilir (policy uyğunluğu) */}
        <link rel="alternate" hrefLang="x-default" href={siteUrl} />
        <link rel="alternate" hrefLang="az" href={`${siteUrl}/az`} />
        <link rel="alternate" hrefLang="en" href={`${siteUrl}/en`} />
        <link rel="alternate" hrefLang="tr" href={`${siteUrl}/tr`} />
        <link rel="alternate" hrefLang="ru" href={`${siteUrl}/ru`} />
        {/* DNS Preconnect — başqa ölkələrdən sürətli yüklənmə üçün */}
        <link rel="preconnect" href="https://lhsmlimcxnuzlnpdbnbq.supabase.co" />
        <link rel="dns-prefetch" href="https://lhsmlimcxnuzlnpdbnbq.supabase.co" />
        <link rel="preconnect" href="https://vitals.vercel-insights.com" />
        <link rel="dns-prefetch" href="https://vitals.vercel-insights.com" />
        <link rel="dns-prefetch" href="https://www.googletagmanager.com" />
        {/* Popup CSS */}
        <link rel="stylesheet" href="/popup.css" />

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
      <body
        className={`${notoSans.variable} antialiased bg-slate-950 text-slate-100 font-sans`}
      >
        <Providers initialLocale={requestLocale}>{children}</Providers>
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
