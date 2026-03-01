import dynamic from "next/dynamic";
import HeroSection from "@/components/home/HeroSection";
import FeaturedProductsSection from "@/components/home/FeaturedProductsSection";
import BenefitsStrip from "@/components/home/BenefitsStrip";
import SiteNavbar from "@/components/layout/SiteNavbar";
import { getHomeProducts, getCategories } from "@/modules/products/queries";
import { getSiteSettings, getPageSections, getHeroSlides } from "@/modules/settings/queries";

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

  return (
    <div className="min-h-screen bg-[#f5faf7] text-emerald-950">
      <SiteNavbar initialSettings={settings} />

      {/* 1. Hero Slider - tam genişlik */}
      <HeroSection brandName={brandName} sectionData={homeSections?.hero} slides={heroSlides} />

      <main className="mx-auto max-w-6xl space-y-16 px-6 py-8">
        {/* 2. Benefits Strip */}
        <BenefitsStrip sectionData={homeSections?.benefits} />
        
        <FeaturedProductsSection products={featuredProducts} />
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
      <section id="contact">
        <HomeFooter />
      </section>
    </div>
  );
}
