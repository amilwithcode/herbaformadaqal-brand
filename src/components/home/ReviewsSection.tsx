"use client";

import { useI18n } from "@/contexts/I18nContext";
import { useEffect, useState, useCallback, useRef } from "react";
import { ChevronLeft, ChevronRight, Star } from "lucide-react";

type Testimonial = {
  id: string;
  name: string;
  role_az: string;
  role_en: string;
  role_ru: string;
  role_tr: string;
  content_az: string;
  content_en: string;
  content_ru: string;
  content_tr: string;
  rating: number;
  image_url: string;
};

export default function ReviewsSection() {
  const { t, locale } = useI18n();
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [current, setCurrent] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const fetchTestimonials = async () => {
      try {
        const res = await fetch("/api/testimonials");
        if (res.ok) {
          const data = await res.json();
          setTestimonials(data);
        }
      } catch (err) {
        console.error("Failed to fetch testimonials:", err);
      }
    };
    fetchTestimonials();
  }, []);

  const goTo = useCallback(
    (index: number) => {
      if (isTransitioning) return;
      setIsTransitioning(true);
      setCurrent(index);
      setTimeout(() => setIsTransitioning(false), 500);
    },
    [isTransitioning]
  );

  const goNext = useCallback(() => {
    if (testimonials.length === 0) return;
    goTo((current + 1) % testimonials.length);
  }, [current, testimonials.length, goTo]);

  const goPrev = useCallback(() => {
    if (testimonials.length === 0) return;
    goTo((current - 1 + testimonials.length) % testimonials.length);
  }, [current, testimonials.length, goTo]);

  // Auto-play
  useEffect(() => {
    if (testimonials.length <= 1) return;
    intervalRef.current = setInterval(goNext, 6000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [goNext, testimonials.length]);

  if (testimonials.length === 0) return null;

  return (
    <section className="relative overflow-hidden rounded-3xl border border-emerald-100 bg-[#e6f3ec] px-6 py-12 md:px-10 md:py-16">
      <div className="mx-auto max-w-4xl text-center">
        <div className="relative">
          {/* Slider Content */}
          <div className="min-h-[250px] md:min-h-[200px]">
            {testimonials.map((item, idx) => (
              <div
                key={item.id}
                className={`transition-all duration-500 ease-in-out ${
                  idx === current
                    ? "opacity-100 translate-x-0"
                    : "absolute inset-0 opacity-0 translate-x-8 pointer-events-none"
                }`}
              >
                <div className="flex flex-col items-center">
                  <div className="mb-4 flex gap-1 text-amber-400">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`h-5 w-5 ${i < item.rating ? "fill-current" : "text-slate-300"}`}
                      />
                    ))}
                  </div>

                  <p className="mb-8 text-lg italic text-slate-700 md:text-xl">
                    "{(item as any)[`content_${locale}`] || item.content_az}"
                  </p>

                  <div className="flex items-center gap-4">
                    {item.image_url ? (
                      <img
                        src={item.image_url}
                        alt={item.name}
                        className="h-12 w-12 rounded-full object-cover shadow-md"
                      />
                    ) : (
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-sm font-bold text-emerald-700 shadow-md">
                        {item.name[0]}
                      </div>
                    )}
                    <div className="text-left">
                      <div className="font-bold text-slate-900">{item.name}</div>
                      <div className="text-sm text-emerald-600">
                        {(item as any)[`role_${locale}`] || item.role_az}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Controls */}
          {testimonials.length > 1 && (
            <>
              <button
                onClick={goPrev}
                className="absolute left-0 top-1/2 -translate-y-1/2 rounded-full bg-white/50 p-2 text-emerald-900 shadow-sm hover:bg-white md:-left-12"
                aria-label="Previous"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
              <button
                onClick={goNext}
                className="absolute right-0 top-1/2 -translate-y-1/2 rounded-full bg-white/50 p-2 text-emerald-900 shadow-sm hover:bg-white md:-right-12"
                aria-label="Next"
              >
                <ChevronRight className="h-6 w-6" />
              </button>

              {/* Dots */}
              <div className="mt-8 flex justify-center gap-2">
                {testimonials.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => goTo(idx)}
                    className={`h-2 rounded-full transition-all ${
                      idx === current ? "w-8 bg-emerald-600" : "w-2 bg-emerald-200"
                    }`}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
