"use client";

import Link from "next/link";
import Image from "next/image";
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
  is_active: boolean;
  sort_order: number;
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
  const { t } = useI18n();
  const name = brandName || "Sağlam Bazar";
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

  // Dynamic content: use slide data or fallback to sectionData/defaults
  const title = activeSlide.title || sectionData?.title || t("hero.title");
  const subtitle =
    activeSlide.subtitle || sectionData?.subtitle || t("hero.subtitle");
  const buttonText =
    activeSlide.button_text || sectionData?.buttonText || t("hero.cta_secondary");
  const buttonLink = activeSlide.button_link || "/products";
  const bgImage = activeSlide.image_url;

  return (
    <section className="relative w-full overflow-hidden">
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
                  alt={slide.title || "Hero"}
                  fill
                  className="object-cover object-center"
                  priority={idx === 0}
                  sizes="100vw"
                  quality={75}
                />
                {/* Overlay */}
                <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-black/15 to-transparent" />
              </div>
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 via-emerald-100/50 to-white" />
            )}
          </div>
        ))}

        {/* Content - always on top */}
        <div className="relative z-20 flex min-h-[600px] md:min-h-[780px] items-center">
          <div className="mx-auto w-full max-w-6xl px-8 md:px-12">
            <div className="grid items-center gap-8 md:grid-cols-[1.2fr_0.8fr]">
              {/* Left - Text */}
              <div className="space-y-6">
                <p
                  className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-[11px] font-medium ${
                    bgImage
                      ? "bg-white/20 text-white"
                      : "bg-emerald-100 text-emerald-800"
                  }`}
                >
                  <span
                    className={`flex h-4 w-4 items-center justify-center rounded-full text-[10px] ${
                      bgImage
                        ? "bg-white/30 text-white"
                        : "bg-emerald-600 text-emerald-50"
                    }`}
                  >
                    🌿
                  </span>
                  {t("hero.natural_products")}
                </p>

                <div className="space-y-4">
                  <h1
                    className={`text-3xl font-semibold leading-tight md:text-5xl transition-all duration-500 ${
                      bgImage ? "text-white" : "text-emerald-950"
                    }`}
                  >
                    {title}
                  </h1>
                  <p
                    className={`max-w-xl text-sm md:text-base transition-all duration-500 ${
                      bgImage ? "text-white/80" : "text-emerald-800"
                    }`}
                  >
                    {subtitle}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-4">
                  <Link
                    href={buttonLink}
                    className={`inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold shadow-sm transition-colors ${
                      bgImage
                        ? "bg-white text-emerald-900 hover:bg-emerald-50"
                        : "bg-emerald-700 text-emerald-50 hover:bg-emerald-600"
                    }`}
                  >
                    {buttonText}
                  </Link>
                  <Link
                    href="/programs"
                    className={`rounded-full border px-6 py-3 text-sm font-semibold transition-colors ${
                      bgImage
                        ? "border-white/30 text-white hover:bg-white/10"
                        : "border-emerald-200 bg-white text-emerald-800 hover:bg-emerald-50"
                    }`}
                  >
                    {t("hero.cta_primary")}
                  </Link>
                </div>

                {/* Stats */}
                <div className="mt-2 flex flex-wrap gap-10 text-xs md:text-sm">
                  <div>
                    <div
                      className={`text-xl font-semibold ${
                        bgImage ? "text-white" : "text-emerald-800"
                      }`}
                    >
                      <CountUp end={500} suffix="+" duration={2500} />
                    </div>
                    <div
                      className={`text-[11px] uppercase tracking-[0.18em] ${
                        bgImage ? "text-white/60" : "text-emerald-500"
                      }`}
                    >
                      {t("hero.stat_products")}
                    </div>
                  </div>
                  <div>
                    <div
                      className={`text-xl font-semibold ${
                        bgImage ? "text-white" : "text-emerald-800"
                      }`}
                    >
                      <CountUp end={10} suffix="K+" duration={2500} />
                    </div>
                    <div
                      className={`text-[11px] uppercase tracking-[0.18em] ${
                        bgImage ? "text-white/60" : "text-emerald-500"
                      }`}
                    >
                      {t("hero.stat_customers")}
                    </div>
                  </div>
                  <div>
                    <div
                      className={`text-xl font-semibold ${
                        bgImage ? "text-white" : "text-emerald-800"
                      }`}
                    >
                      <CountUp end={4.9} decimals={1} duration={2500} />
                    </div>
                    <div
                      className={`text-[11px] uppercase tracking-[0.18em] ${
                        bgImage ? "text-white/60" : "text-emerald-500"
                      }`}
                    >
                      {t("hero.stat_rating")}
                    </div>
                  </div>
                </div>
              </div>

              {/* Right - decorative circle (only when no bg image) */}
              {!bgImage && (
                <div className="relative hidden items-center justify-center md:flex">
                  <div className="absolute -right-24 -top-24 h-56 w-56 rounded-full bg-emerald-50" />
                  <div className="relative flex h-72 w-72 items-center justify-center rounded-full bg-emerald-100 shadow-[0_0_80px_rgba(16,185,129,0.35)] md:h-80 md:w-80">
                    <div className="flex h-52 w-52 flex-col items-center justify-center rounded-full bg-emerald-50 text-center text-emerald-800 md:h-60 md:w-60 px-4">
                      <span className="mb-3 text-3xl">🌿</span>
                      <span className="text-sm font-medium">{firstLine}</span>
                      {secondLine && (
                        <span className="text-sm">{secondLine}</span>
                      )}
                    </div>
                  </div>
                </div>
              )}
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
