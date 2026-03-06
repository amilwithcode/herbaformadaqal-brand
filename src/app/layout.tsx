import type { Metadata } from "next";
import { Noto_Sans } from "next/font/google";
import { getSupabaseServerClient } from "@/lib/supabase-server";
import Script from "next/script";
import SpeedInsightsWrapper from "@/components/common/SpeedInsightsWrapper";
import "./globals.css";
import Providers from "./providers";

const notoSans = Noto_Sans({
  variable: "--font-noto-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap", // Font yüklənənə qədər system font göstər - CLS yaxşılaşır
});

export async function generateMetadata(): Promise<Metadata> {
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

  const settings = settingsData.data;
  const meta = metaData.data;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.herbaformadaqal.com";
  
  const title = meta?.title || settings?.public_site_name || settings?.site_name || "Herbalife - Sağlam Həyat Üçün Məhsullar";
  const description = meta?.description || "Herbalife məhsulları ilə sağlam həyat tərzi. Arıqlama, çəki artırma və sağlam qidalanma üçün professional həllər. Azərbaycanda rəsmi distribütor.";
  const keywords = meta?.keywords || "herbalife, sağlamlıq, arıqlama, çəki itirmə, qidalanma, vitamin, əlavə, azərbaycan, bakı, sağlam həyat";
  const ogImage = meta?.og_image || meta?.image || settings?.logo || `${siteUrl}/og-image.jpg`;

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
    },
    openGraph: {
      type: "website",
      locale: "az_AZ",
      url: siteUrl,
      siteName: settings?.public_site_name || "Herbalife",
      title: meta?.og_title || title,
      description: meta?.og_description || description,
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
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
    icons: settings?.logo ? { icon: settings.logo } : undefined,
    verification: {
      google: process.env.GOOGLE_VERIFICATION_CODE,
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="az">
      <head>
        {/* DNS Prefetch & Preconnect - xarici resursları öncədən bağla */}
        <link rel="preconnect" href="https://lhsmlimcxnuzlnpdbnbq.supabase.co" />
        <link rel="dns-prefetch" href="https://lhsmlimcxnuzlnpdbnbq.supabase.co" />
        {/* Popup CSS */}
        <link rel="stylesheet" href="/popup.css" />
      </head>
      <body
        className={`${notoSans.variable} antialiased bg-slate-950 text-slate-100 font-sans`}
      >
        <Providers>{children}</Providers>
        {/* Popup Script - Load after page content */}
        <Script src="/popup.js" strategy="afterInteractive" />
        {/* Vercel Speed Insights - yalnız Vercel deployment-da aktivdir */}
        <SpeedInsightsWrapper />
      </body>
    </html>
  );
}

