"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

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
      <div className="space-y-6">
        {[1].map((i) => (
          <div
            key={i}
            className="animate-pulse rounded-2xl bg-slate-200 h-[280px] md:h-[340px]"
          />
        ))}
      </div>
    );
  }

  if (banners.length === 0) return null;

  return (
    <div className="space-y-6">
      {banners.map((banner) => (
        <section
          key={banner.id}
          className="relative overflow-hidden rounded-2xl shadow-lg"
          style={{ backgroundColor: banner.bg_color }}
        >
          {/* Decorative gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-white/5" />

          <div className="relative flex flex-col md:flex-row items-center justify-between gap-6 md:gap-10 px-8 md:px-14 py-10 md:py-14">
            {/* Left - Text Content */}
            <div className="flex-1 space-y-4 max-w-lg z-10">
              {banner.badge_text && (
                <span className="inline-block rounded-sm bg-white/20 px-3 py-1 text-xs font-bold uppercase tracking-widest text-white">
                  {banner.badge_text}
                </span>
              )}
              <h2 className="text-2xl md:text-3xl font-bold leading-tight text-white">
                {banner.title}
              </h2>
              {banner.description && (
                <p className="text-sm md:text-base text-white/80 leading-relaxed">
                  {banner.description}
                </p>
              )}
              {banner.button_text && (
                <Link
                  href={banner.button_link || "/products"}
                  className="inline-block rounded-sm bg-white px-6 py-3 text-sm font-bold uppercase tracking-wider transition-all hover:shadow-lg hover:scale-105"
                  style={{ color: banner.bg_color }}
                >
                  {banner.button_text}
                </Link>
              )}
            </div>

            {/* Right - Product Image */}
            {banner.image_url && (
              <div className="flex-shrink-0 z-10">
                <img
                  src={banner.image_url}
                  alt={banner.title}
                  className="h-[200px] md:h-[280px] w-auto object-contain drop-shadow-2xl"
                />
              </div>
            )}
          </div>
        </section>
      ))}
    </div>
  );
}
