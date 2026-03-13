import dynamic from "next/dynamic";
import type { Metadata } from "next";
import HeroSection from "@/components/home/HeroSection";
import FeaturedProductsSection from "@/components/home/FeaturedProductsSection";
import BenefitsStrip from "@/components/home/BenefitsStrip";
import SiteNavbar from "@/components/layout/SiteNavbar";
import { getHomeProducts, getCategories } from "@/modules/products/queries";
import { cookies, headers } from "next/headers";
import { getSiteSettings, getPageSections, getHeroSlides, getMetaTags } from "@/modules/settings/queries";
import { ensureAbsoluteImageUrl } from "@/lib/seo-utils";

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

// Below-the-fold komponentləri lazy load edirik - ilk yüklənməni sürətləndirir
const CategoriesSection = dynamic(() => import("@/components/home/CategoriesSection"), { ssr: true });
const ProgramsSection = dynamic(() => import("@/components/home/ProgramsSection"), { ssr: true });
const ReviewsSection = dynamic(() => import("@/components/home/ReviewsSection"), { ssr: true });
const BlogSection = dynamic(() => import("@/components/home/BlogSection"), { ssr: true });
const FAQSection = dynamic(() => import("@/components/home/FAQSection"), { ssr: true });
const PromoBannerSection = dynamic(() => import("@/components/home/PromoBannerSection"), { ssr: true });
const WeightCalculatorSection = dynamic(() => import("@/components/home/WeightCalculatorSection"), { ssr: true });
const GoalsStrip = dynamic(() => import("@/components/home/GoalsStrip"), { ssr: true });
const HomeFooter = dynamic(() => import("@/components/home/HomeFooter"), { ssr: true });

// ISR: Səhifəni hər 60 saniyədə yenilə, lakin keşlə
export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  const [settings, metaTags, requestLocale] = await Promise.all([
    getSiteSettings(),
    getMetaTags("home"),
    getRequestLocale(),
  ]);

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.herbaformadaqal.com";
  const brandName = settings?.public_site_name || settings?.site_name || "Herbalife";
  
  const title = metaTags?.title || `${brandName} - Sağlam Həyat Üçün Herbalife Məhsulları | Azərbaycan`;
  const description = metaTags?.description || "Herbalife məhsulları ilə sağlam həyat tərzi. Arıqlama, çəki artırma və sağlam qidalanma üçün professional həllər. Azərbaycanda rəsmi distribütor. Pulsuz çatdırılma Bakı daxilində.";
  const keywords = metaTags?.keywords || "herbalife azərbaycan, herbalife bakı, arıqlama məhsulları, çəki itirmə, sağlam qidalanma, vitamin, əlavə, herbalife distribütor, sağlam həyat, herbalife məhsulları";
  const rawOgImage = metaTags?.og_image || metaTags?.image || settings?.logo || `${siteUrl}/og-image.jpg`;
  const ogImage = ensureAbsoluteImageUrl(rawOgImage, siteUrl) || `${siteUrl}/og-image.jpg`;

  return {
    title,
    description,
    keywords: keywords.split(",").map((k: string) => k.trim()),
    openGraph: {
      title: metaTags?.og_title || title,
      description: metaTags?.og_description || description,
      url: siteUrl,
      siteName: brandName,
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
      locale: OG_LOCALE_MAP[requestLocale],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: metaTags?.og_title || title,
      description: metaTags?.og_description || description,
      images: [ogImage],
    },
    alternates: {
      canonical: siteUrl,
    },
  };
}

export default async function Home() {
  const [rawProducts, categories, settings, homeSections, heroSlides] = await Promise.all([
    getHomeProducts(),
    getCategories(),
    getSiteSettings(),
    getPageSections("home"),
    getHeroSlides(),
  ]);
  
  const brandName =
    (settings?.public_site_name && settings.public_site_name.trim()) ||
    (settings?.site_name && settings.site_name.trim()) ||
    "Sağlam Bazar";

  const featuredProducts = rawProducts.map((p) => {
    const basePrice = Number(p.base_price) || 0;
    const discount = Number(p.discount_percent) || 0;
    const finalPrice = basePrice * (1 - discount / 100);
    const name = p.translations?.find((t: any) => t.field === "title")?.value
      || p.slug?.charAt(0).toUpperCase() + p.slug?.slice(1).replace(/-/g, " ")
      || "Məhsul";
    return {
      id: p.id,
      slug: p.slug,
      name,
      price: finalPrice,
      originalPrice: discount > 0 ? basePrice : null,
      imageUrl: p.image_url,
      rating: p.rating_average || 0,
      reviewCount: p.review_count || 0,
      tag: null,
    };
  });

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.herbaformadaqal.com";

  // Structured Data (JSON-LD) for SEO – Google üçün absolute URL
  const logoUrl = ensureAbsoluteImageUrl(settings?.logo, siteUrl) || `${siteUrl}/logo.png`;
  const defaultImage = ensureAbsoluteImageUrl(settings?.logo, siteUrl) || `${siteUrl}/og-image.jpg`;
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "HealthAndBeautyBusiness",
    "name": brandName,
    "description": "Herbalife məhsulları ilə sağlam həyat tərzi. Arıqlama, çəki artırma və sağlam qidalanma üçün professional həllər.",
    "url": siteUrl,
    "logo": logoUrl,
    "image": defaultImage,
    "telephone": settings?.footer_phone || "+994 50 123 45 67",
    "address": {
      "@type": "PostalAddress",
      "addressCountry": "AZ",
      "addressLocality": "Bakı",
    },
    "sameAs": [
      // Social media links will be added here
    ],
    "offers": {
      "@type": "AggregateOffer",
      "offerCount": featuredProducts.length,
      "lowPrice": featuredProducts.length > 0 ? Math.min(...featuredProducts.map(p => p.price)) : 0,
      "highPrice": featuredProducts.length > 0 ? Math.max(...featuredProducts.map(p => p.price)) : 0,
      "priceCurrency": "AZN",
    },
  };

  return (
    <div className="min-h-screen bg-[#f5faf7] text-emerald-950">
      {/* Structured Data for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      
      <SiteNavbar initialSettings={settings} />

      {/* 1. Hero Slider - tam genişlik */}
      <HeroSection brandName={brandName} sectionData={homeSections?.hero} slides={heroSlides} />

      <main className="mx-auto max-w-6xl space-y-12 sm:space-y-16 px-3 sm:px-4 md:px-6 py-6 sm:py-8 pb-20 sm:pb-24 md:pb-8">
        {/* 1. Featured Products - 1-ci sırada */}
        <FeaturedProductsSection products={featuredProducts} />
        
        {/* 2. Benefits Strip */}
        <BenefitsStrip sectionData={homeSections?.benefits} />
        <WeightCalculatorSection />
        <PromoBannerSection />
        <CategoriesSection categories={categories} />
        <section id="programs">
          <ProgramsSection />
        </section>
        <BlogSection />
        <section id="about">
          <ReviewsSection />
        </section>
        <FAQSection />
      </main>
      <GoalsStrip />
      <section id="contact" className="pb-20 md:pb-0">
        <HomeFooter />
      </section>
    </div>
  );
}
