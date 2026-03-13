"use client";

import Image from "next/image";
import { LocalizedLink } from "@/components/navigation/LocalizedLink";
import { useI18n } from "@/contexts/I18nContext";
import CountUp from "@/components/ui/CountUp";
import { useEffect, useState, useCallback, useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export type HeroSlide = {
  id: number;
  title: string;
  subtitle: string;
  button_text: string;
  button_link: string;
  image_url: string;
  image_position?: string;
  is_active: boolean;
  sort_order: number;
  locale?: string;
};

// Default slide data when no slides from DB
const DEFAULT_SLIDES: HeroSlide[] = [
  {
    id: 0,
    title: "",
    subtitle: "",
    button_text: "",
    button_link: "/products",
    image_url: "",
    is_active: true,
    sort_order: 0,
  },
];

export default function HeroSection({
  brandName,
  sectionData,
  slides: externalSlides,
}: {
  brandName?: string;
  sectionData?: any;
  slides?: HeroSlide[];
}) {
  const { t, locale } = useI18n();
  const name = brandName || t("hero.brand_fallback");
  const parts = name.split(" ");
  const firstLine = parts.length > 1 ? parts.slice(0, -1).join(" ") : name;
  const secondLine = parts.length > 1 ? parts[parts.length - 1] : "";

  const slides =
    externalSlides && externalSlides.length > 0
      ? externalSlides
      : DEFAULT_SLIDES;

  const [current, setCurrent] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const goTo = useCallback(
    (index: number) => {
      if (isTransitioning) return;
      setIsTransitioning(true);
      setCurrent(index);
      setTimeout(() => setIsTransitioning(false), 600);
    },
    [isTransitioning]
  );

  const goNext = useCallback(() => {
    goTo((current + 1) % slides.length);
  }, [current, slides.length, goTo]);

  const goPrev = useCallback(() => {
    goTo((current - 1 + slides.length) % slides.length);
  }, [current, slides.length, goTo]);

  // Auto-play
  useEffect(() => {
    if (slides.length <= 1) return;
    intervalRef.current = setInterval(goNext, 5000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [goNext, slides.length]);

  const activeSlide = slides[current];

  // Slaydın dili cari dilə uyğun deyilsə mətni tərcümə ilə göstər (dilə görə dəyişsin)
  const slideLocale = activeSlide.locale;
  const slideMatchesLocale = slideLocale && slideLocale === locale;
  const useTranslatedContent = !slideMatchesLocale;

  const title = useTranslatedContent
    ? t("hero.title")
    : (activeSlide.title || sectionData?.title || t("hero.title"));
  const subtitle = useTranslatedContent
    ? t("hero.subtitle")
    : (activeSlide.subtitle || sectionData?.subtitle || t("hero.subtitle"));
  const buttonText = useTranslatedContent
    ? t("hero.cta_secondary")
    : (activeSlide.button_text || sectionData?.buttonText || t("hero.cta_secondary"));
  const buttonLink = activeSlide.button_link || "/products";
  const bgImage = activeSlide.image_url;

  return (
    <section className="hidden md:block relative w-full overflow-hidden">
      {/* Slides */}
      <div className="relative min-h-[600px] md:min-h-[780px]">
        {slides.map((slide, idx) => (
          <div
            key={slide.id}
            className={`absolute inset-0 transition-all duration-700 ease-in-out ${
              idx === current
                ? "opacity-100 z-10"
                : "opacity-0 z-0"
            }`}
          >
            {/* Background Image - next/image ilə optimallaşdırılmış */}
            {slide.image_url ? (
              <div className="absolute inset-0">
                <Image
                  src={slide.image_url}
                  alt={slide.title || t("common.hero_alt")}
                  fill
                  className="object-cover object-center"
                  style={{
                    objectPosition: slide.image_position || "center center",
                  }}
                  priority={idx === 0}
                  sizes="100vw"
                  quality={90}
                />
                {/* Overlay - darker on left for text readability */}
                <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-black/20 to-transparent" />
              </div>
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 via-emerald-100/50 to-white" />
            )}
          </div>
        ))}

        {/* Content - always on top */}
        <div className="relative z-20 flex min-h-[600px] md:min-h-[780px] items-center">
          <div className="mx-auto w-full max-w-6xl px-8 md:px-12">
            {/* Left - Text Overlay */}
            <div className="max-w-2xl">
              <div className="space-y-6">
                <h1
                  className={`text-4xl font-bold leading-tight md:text-6xl transition-all duration-500 ${
                    bgImage ? "text-white" : "text-emerald-950"
                  }`}
                >
                  {title}
                </h1>
                <p
                  className={`max-w-xl text-base md:text-lg leading-relaxed transition-all duration-500 ${
                    bgImage ? "text-white" : "text-emerald-800"
                  }`}
                >
                  {subtitle}
                </p>

                <div className="flex flex-wrap items-center gap-4 pt-2">
                  <LocalizedLink
                    href={buttonLink}
                    className={`inline-flex items-center gap-2 rounded-full px-8 py-3.5 text-sm font-semibold shadow-lg transition-colors ${
                      bgImage
                        ? "bg-white text-black hover:bg-emerald-50"
                        : "bg-emerald-700 text-emerald-50 hover:bg-emerald-600"
                    }`}
                  >
                    {buttonText}
                  </LocalizedLink>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Arrows */}
        {slides.length > 1 && (
          <>
            <button
              onClick={goPrev}
              className="absolute left-4 top-1/2 z-30 -translate-y-1/2 rounded-full bg-white/20 p-2 text-white transition-all hover:bg-white/40"
              aria-label={t("hero.prev_slide")}
            >
              <ChevronLeft size={24} />
            </button>
            <button
              onClick={goNext}
              className="absolute right-4 top-1/2 z-30 -translate-y-1/2 rounded-full bg-white/20 p-2 text-white transition-all hover:bg-white/40"
              aria-label={t("hero.next_slide")}
            >
              <ChevronRight size={24} />
            </button>
          </>
        )}

        {/* Dots */}
        {slides.length > 1 && (
          <div className="absolute bottom-6 left-1/2 z-30 flex -translate-x-1/2 gap-2">
            {slides.map((_, idx) => (
              <button
                key={idx}
                onClick={() => goTo(idx)}
                className={`h-2.5 rounded-full transition-all duration-300 ${
                  idx === current
                    ? "w-8 bg-white"
                    : "w-2.5 bg-white/40 hover:bg-white/60"
                }`}
                aria-label={`${t("hero.slide")} ${idx + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
