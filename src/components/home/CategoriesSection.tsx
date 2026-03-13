"use client";

import { useState } from "react";
import { useI18n } from "@/contexts/I18nContext";
import type { Category } from "@/modules/products/types";
import { LocalizedLink } from "@/components/navigation/LocalizedLink";
import Image from "next/image";
import { ArrowRight, ImageOff } from "lucide-react";

export default function CategoriesSection({ categories }: { categories?: Category[] }) {
  const { t } = useI18n();

  if (!categories || categories.length === 0) {
    return null;
  }

  return (
    <section className="rounded-3xl border border-emerald-100 bg-[#e6f3ec] px-6 py-8 md:px-10 md:py-10 space-y-8">
      <div className="text-center space-y-2">
        <h2 className="text-xl md:text-2xl font-semibold text-emerald-950">
          {t("home.categories.title")}
        </h2>
        <p className="text-sm text-emerald-700">
          {t("home.categories.subtitle")}
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {categories.map((cat) => (
          <CategoryCard key={cat.id} category={cat} t={t} />
        ))}
      </div>
    </section>
  );
}

function CategoryCard({ category, t }: { category: Category; t: (key: string) => string }) {
  const [hovered, setHovered] = useState(false);

  return (
    <LocalizedLink
      href={`/categories/${category.slug}`}
      className="group block overflow-hidden rounded-2xl shadow-sm transition-all hover:shadow-xl"
    >
      <div
        className="relative w-full aspect-[4/3] overflow-hidden rounded-2xl bg-[#f1f8f4]"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {/* Full-card image */}
        {category.icon ? (
          <Image
            src={category.icon}
            alt={category.name}
            fill
            className={`object-cover transition-transform duration-500 ease-out ${
              hovered ? "scale-110" : "scale-100"
            }`}
            sizes="(max-width: 768px) 100vw, 33vw"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-emerald-100 to-emerald-200">
            <ImageOff size={48} className="text-emerald-300" />
          </div>
        )}

        {/* Hover overlay – slides up from bottom */}
        <div
          className={`absolute inset-x-0 bottom-0 z-10 transition-all duration-300 ease-out ${
            hovered
              ? "translate-y-0 opacity-100"
              : "translate-y-full opacity-0"
          }`}
        >
          <div className="bg-gradient-to-t from-black/80 via-black/50 to-transparent pt-16 pb-5 px-5 space-y-3">
            <h3 className="text-base font-bold text-white drop-shadow-sm">
              {category.name}
            </h3>
            <div className="flex items-center gap-2 text-emerald-300 text-sm font-medium">
              <span>{t("categories.go_to_category")}</span>
              <ArrowRight size={16} />
            </div>
          </div>
        </div>

        {/* Non-hover: minimal bottom info */}
        <div
          className={`absolute inset-x-0 bottom-0 z-[5] transition-opacity duration-200 ${
            hovered ? "opacity-0" : "opacity-100"
          }`}
        >
          <div className="bg-gradient-to-t from-black/60 to-transparent pt-10 pb-4 px-5">
            <h3 className="text-base font-semibold text-white line-clamp-1 drop-shadow-sm">
              {category.name}
            </h3>
          </div>
        </div>
      </div>
    </LocalizedLink>
  );
}
