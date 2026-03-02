"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";

type PromoBanner = {
  id: number;
  badge_text: string;
  title: string;
  description: string;
  button_text: string;
  button_link: string;
  image_url: string;
  bg_color: string;
};

export default function PromoBannerSection() {
  const [banners, setBanners] = useState<PromoBanner[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    fetch("/api/content/promo-banners")
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (!active) return;
        setBanners(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        if (!active) return;
        setBanners([]);
      })
      .finally(() => {
        if (!active) return;
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="space-y-8 md:space-y-10">
        {[1, 2].map((i) => (
          <div
            key={i}
            className="animate-pulse rounded-3xl bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 h-[320px] md:h-[420px]"
          />
        ))}
      </div>
    );
  }

  if (banners.length === 0) return null;

  return (
    <div className="space-y-8 md:space-y-10">
      {banners.map((banner) => (
        <section
          key={banner.id}
          className="group relative overflow-hidden rounded-3xl shadow-xl transition-all duration-500 hover:shadow-2xl hover:scale-[1.01]"
          style={{ backgroundColor: banner.bg_color }}
        >
          {/* Enhanced gradient overlays for depth */}
          <div className="absolute inset-0 bg-gradient-to-br from-black/5 via-transparent to-white/10" />
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-white/5" />
          
          {/* Subtle pattern overlay */}
          <div className="absolute inset-0 opacity-[0.03] bg-[radial-gradient(circle_at_1px_1px,white_1px,transparent_0)] [background-size:20px_20px]" />

          {/* Content Container */}
          <div className="relative flex flex-col md:flex-row items-center justify-between gap-8 md:gap-12 px-6 md:px-16 py-12 md:py-16 lg:py-20">
            {/* Left - Text Content */}
            <div className="flex-1 space-y-5 md:space-y-6 z-10 md:w-[45%]">
              {/* Badge */}
              {banner.badge_text && (
                <div className="inline-flex items-center">
                  <span className="inline-flex items-center rounded-full bg-white/25 backdrop-blur-sm border border-white/30 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.15em] text-white shadow-lg">
                    {banner.badge_text}
                  </span>
                </div>
              )}

              {/* Title */}
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold leading-tight text-white drop-shadow-lg">
                {banner.title}
              </h2>

              {/* Description */}
              {banner.description && (
                <p className="text-base md:text-lg text-white/90 leading-relaxed max-w-xl drop-shadow-md">
                  {banner.description}
                </p>
              )}

              {/* CTA Button */}
              {banner.button_text && (
                <div className="pt-2">
                  <Link
                    href={banner.button_link || "/products"}
                    className="group/btn inline-flex items-center justify-center gap-2 rounded-full bg-white px-8 py-4 text-sm font-bold uppercase tracking-wider transition-all duration-300 hover:shadow-2xl hover:scale-105 hover:-translate-y-0.5 active:scale-100"
                    style={{ color: banner.bg_color }}
                  >
                    <span>{banner.button_text}</span>
                    <svg
                      className="w-4 h-4 transition-transform duration-300 group-hover/btn:translate-x-1"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2.5}
                        d="M13 7l5 5m0 0l-5 5m5-5H6"
                      />
                    </svg>
                  </Link>
                </div>
              )}
            </div>

            {/* Right - Product Image - Bannerin yarısını tutur */}
            {banner.image_url && (
              <div className="relative flex-shrink-0 z-10 w-full md:w-[55%] h-[320px] md:h-[500px] lg:h-[600px]">
                {/* Image glow effect */}
                <div 
                  className="absolute inset-0 blur-3xl opacity-30"
                  style={{
                    background: `radial-gradient(circle at center, rgba(255,255,255,0.3) 0%, transparent 70%)`
                  }}
                />
                
                {/* Image container with enhanced shadow */}
                <div className="relative h-full w-full">
                  <Image
                    src={banner.image_url}
                    alt={banner.title}
                    fill
                    className="object-contain drop-shadow-[0_20px_50px_rgba(0,0,0,0.3)] transition-transform duration-500 group-hover:scale-105"
                    sizes="(max-width: 768px) 100vw, 50vw"
                    loading="lazy"
                    quality={90}
                  />
                </div>

                {/* Decorative elements */}
                <div className="absolute -bottom-4 -right-4 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
                <div className="absolute -top-4 -left-4 w-24 h-24 bg-white/5 rounded-full blur-xl" />
              </div>
            )}
          </div>

          {/* Corner accent */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-white/10 to-transparent rounded-bl-full" />
        </section>
      ))}
    </div>
  );
}
