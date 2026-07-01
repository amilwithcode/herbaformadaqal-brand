import dynamic from "next/dynamic";
import type { Metadata } from "next";
import HeroSection from "@/components/home/HeroSection";
import FeaturedProductsSection from "@/components/home/FeaturedProductsSection";
import BenefitsStrip from "@/components/home/BenefitsStrip";
import SiteNavbar from "@/components/layout/SiteNavbar";
import { AdSenseAd } from "@/components/analytics/AdSenseAd";
import { getHomeProducts, getCategories } from "@/modules/products/queries";
import { getSiteSettings, getPageSections, getHeroSlides, getMetaTags } from "@/modules/settings/queries";
import { ensureAbsoluteImageUrl } from "@/lib/seo-utils";
import { parseKeywords } from "@/lib/keywords-utils";
import { getMessages } from "@/lib/i18n";
import { productSearchHaystack } from "@/lib/product-search";
import { getSiteUrl } from "@/lib/site-url";

const OG_LOCALE_MAP: Record<string, string> = {
  az: "az_AZ",
  en: "en_US",
  tr: "tr_TR",
  ru: "ru_RU",
};

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

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const [settings, metaTags] = await Promise.all([
    getSiteSettings(),
    getMetaTags("home"),
  ]);

  const siteUrl = getSiteUrl();
  const brandName = settings?.public_site_name || settings?.site_name || "Herbalife";
  const localePath = ["az", "en", "tr", "ru"].includes(locale) ? locale : "az";

  const title = metaTags?.title || `${brandName} - Sağlam Həyat Üçün Herbalife Məhsulları | Azərbaycan`;
  const description = metaTags?.description || "Herbalife məhsulları ilə sağlam həyat tərzi. Arıqlama, çəki artırma və sağlam qidalanma üçün professional həllər. Azərbaycanda müstəqil Herbalife distribütoru. Pulsuz çatdırılma Bakı daxilində.";
  const keywordsRaw = metaTags?.keywords || "herbalife azərbaycan, herbalife bakı, arıqlama məhsulları, çəki itirmə, sağlam qidalanma, vitamin, əlavə, herbalife distribütor, sağlam həyat, herbalife məhsulları";
  const keywords = parseKeywords(keywordsRaw);
  const rawOgImage = metaTags?.og_image || metaTags?.image || settings?.logo || `${siteUrl}/og-image.jpg`;
  const ogImage = ensureAbsoluteImageUrl(rawOgImage, siteUrl) || `${siteUrl}/og-image.jpg`;

  return {
    title,
    description,
    keywords: keywords.length > 0 ? keywords : undefined,
    openGraph: {
      title: metaTags?.og_title || title,
      description: metaTags?.og_description || description,
      url: `${siteUrl}/${localePath}`,
      siteName: brandName,
      images: [
        { url: ogImage, width: 1200, height: 630, alt: title },
      ],
      locale: OG_LOCALE_MAP[localePath] || "az_AZ",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: metaTags?.og_title || title,
      description: metaTags?.og_description || description,
      images: [ogImage],
    },
    alternates: {
      canonical: `${siteUrl}/${localePath}`,
      languages: {
        "x-default": `${siteUrl}/az`,
        az: `${siteUrl}/az`,
        en: `${siteUrl}/en`,
        tr: `${siteUrl}/tr`,
        ru: `${siteUrl}/ru`,
      },
    },
  };
}

export default async function Home({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const [rawProducts, categories, settings, homeSections, heroSlides, messages] = await Promise.all([
    getHomeProducts(),
    getCategories(locale),
    getSiteSettings(),
    getPageSections("home"),
    getHeroSlides(locale),
    getMessages(locale),
  ]);

  const brandFallback = messages["hero.brand_fallback"] || "Sağlam Bazar";
  const productFallback = messages["home.product_fallback"] || "Məhsul";
  const structuredDesc = messages["home.structured_description"] || "Herbalife məhsulları ilə sağlam həyat tərzi. Arıqlama, çəki artırma və sağlam qidalanma üçün professional həllər.";

  const brandName =
    (settings?.public_site_name && settings.public_site_name.trim()) ||
    (settings?.site_name && settings.site_name.trim()) ||
    brandFallback;

  const featuredProducts = rawProducts.map((p) => {
    const basePrice = Number(p.base_price) || 0;
    const discount = Number(p.discount_percent) || 0;
    const finalPrice = basePrice * (1 - discount / 100);
    const name = p.translations?.find((tr: any) => tr.language === locale && tr.field === "title")?.value
      || p.translations?.find((t: any) => t.field === "title")?.value
      || (p.slug ? p.slug.charAt(0).toUpperCase() + p.slug.slice(1).replace(/-/g, " ") : null)
      || productFallback;
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
      searchBlob: productSearchHaystack(p),
    };
  });

  const siteUrl = getSiteUrl();

  const logoUrl = ensureAbsoluteImageUrl(settings?.logo, siteUrl) || `${siteUrl}/logo.png`;
  const defaultImage = ensureAbsoluteImageUrl(settings?.logo, siteUrl) || `${siteUrl}/og-image.jpg`;
  const structuredData: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "HealthAndBeautyBusiness",
    name: brandName,
    description: `${structuredDesc} Müstəqil Herbalife distribütoru.`,
    url: `${siteUrl}/${locale}`,
    logo: logoUrl,
    image: defaultImage,
    address: {
      "@type": "PostalAddress",
      addressCountry: "AZ",
      addressLocality: "Bakı",
      ...(settings?.footer_address
        ? { streetAddress: settings.footer_address }
        : {}),
    },
    sameAs: [],
    offers: {
      "@type": "AggregateOffer",
      offerCount: featuredProducts.length,
      lowPrice:
        featuredProducts.length > 0
          ? Math.min(...featuredProducts.map((p) => p.price))
          : 0,
      highPrice:
        featuredProducts.length > 0
          ? Math.max(...featuredProducts.map((p) => p.price))
          : 0,
      priceCurrency: "AZN",
    },
  };

  if (settings?.footer_phone) {
    structuredData.telephone = settings.footer_phone;
  }
  if (settings?.footer_email) {
    structuredData.email = settings.footer_email;
  }

  return (
    <div className="min-h-screen bg-[#f5faf7] text-emerald-950">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      <SiteNavbar initialSettings={settings} />

      <HeroSection brandName={brandName} sectionData={homeSections?.hero} slides={heroSlides} />

      <main className="mx-auto max-w-6xl space-y-12 sm:space-y-16 px-3 sm:px-4 md:px-6 py-6 sm:py-8 pb-20 sm:pb-24 md:pb-8">
        <FeaturedProductsSection products={featuredProducts} />
        <div className="py-4">
          <AdSenseAd adSlot="4825966200" />
        </div>
        <BenefitsStrip sectionData={homeSections?.benefits} />
        <WeightCalculatorSection />
        <PromoBannerSection />
        <CategoriesSection categories={categories} />
        <section id="about">
          <ReviewsSection />
        </section>
        <section id="programs">
          <ProgramsSection />
        </section>
        <BlogSection />
        <div className="py-4 flex justify-center">
          <AdSenseAd
            adSlot="4981878875"
            style={{ display: "inline-block", width: "728px", height: "90px" }}
            adFormat={undefined}
            adLayoutKey={undefined}
          />
        </div>
        <FAQSection />
        <div className="py-4">
          <AdSenseAd
            adSlot="3860368899"
            adFormat="autorelaxed"
          />
        </div>
      </main>
      <GoalsStrip />
      <section id="contact" className="pb-20 md:pb-0">
        <HomeFooter />
      </section>
    </div>
  );
}
