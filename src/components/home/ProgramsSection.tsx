"use client";

import { useEffect, useState } from "react";
import { LocalizedLink } from "@/components/navigation/LocalizedLink";
import Image from "next/image";
import { useI18n } from "@/contexts/I18nContext";
import { useSiteSettings } from "@/contexts/SiteSettingsContext";
import { Clock, ArrowRight, ImageOff } from "lucide-react";

type ProgramCard = {
  id: string;
  slug: string;
  title: string;
  description: string;
  imageUrl: string;
  duration: string;
  price: number;
};

export default function ProgramsSection() {
  const { t } = useI18n();
  const { hidePrices } = useSiteSettings();
  const [programs, setPrograms] = useState<ProgramCard[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    fetch("/api/content/programs")
      .then((res) => (res.ok ? res.json() : []))
      .then((rows) => {
        if (!active) return;
        const list = Array.isArray(rows) ? rows : [];
        const mapped: ProgramCard[] = list
          .filter((row) => row.is_active !== false)
          .map((row) => ({
            id: String(row.id),
            slug: row.slug || String(row.id),
            title: row.title || "",
            description: row.description || "",
            imageUrl: row.image_url || "",
            duration: row.duration || "",
            price: Number(row.price) || 0,
          }))
          .slice(0, 3);
        setPrograms(mapped);
      })
      .catch(() => {
        if (!active) return;
        setPrograms([]);
      })
      .finally(() => {
        if (!active) return;
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <section className="space-y-6 rounded-3xl border border-emerald-100 bg-[#e6f3ec] px-6 py-8 md:px-10 md:py-10">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-semibold text-emerald-950">
            {t("home.programs.title")}
          </h2>
          <p className="mt-1 text-sm text-emerald-700">
            {t("home.programs.subtitle")}
          </p>
        </div>
        <LocalizedLink
          href="/programs"
          className="inline-flex items-center gap-2 rounded-full border border-emerald-400/60 bg-white px-4 py-1.5 text-xs font-medium text-emerald-700 hover:bg-emerald-50"
        >
          {t("home.programs.view_all")}
          <span>→</span>
        </LocalizedLink>
      </div>
      {loading && (
        <p className="text-xs text-emerald-700">{t("programs.loading")}</p>
      )}
      {!loading && programs.length === 0 && (
        <p className="text-xs text-emerald-700">
          {t("programs.empty")}
        </p>
      )}
      {!loading && programs.length > 0 && (
        <div className="grid gap-6 md:grid-cols-3">
          {programs.map((program) => (
            <ProgramCardItem key={program.id} program={program} hidePrices={hidePrices} t={t} />
          ))}
        </div>
      )}
    </section>
  );
}

function ProgramCardItem({ program, hidePrices, t }: { program: ProgramCard; hidePrices: boolean; t: (key: string) => string }) {
  const [hovered, setHovered] = useState(false);

  return (
    <LocalizedLink
      href={`/programs/${program.slug}`}
      className="group block overflow-hidden rounded-2xl shadow-sm transition-all hover:shadow-xl"
    >
      <div
        className="relative w-full aspect-[3/4] overflow-hidden rounded-2xl bg-[#f1f8f4]"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {/* Full-card image */}
        {program.imageUrl ? (
          <Image
            src={program.imageUrl}
            alt={program.title}
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

        {/* Top badges */}
        {program.duration && (
          <div className="absolute top-3 left-3 z-20">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-black/50 backdrop-blur-sm px-3 py-1 text-[11px] font-medium text-white shadow-md">
              <Clock size={12} />
              {program.duration}
            </span>
          </div>
        )}

        {!hidePrices && (
          <div className="absolute top-3 right-3 z-20">
            {program.price === 0 ? (
              <span className="inline-flex rounded-full bg-emerald-600 px-3 py-1 text-[11px] font-bold text-white shadow-md">
                {t("common.free")}
              </span>
            ) : program.price > 0 ? (
              <span className="inline-flex rounded-full bg-emerald-600 px-3 py-1 text-[11px] font-bold text-white shadow-md">
                ₼{program.price}
              </span>
            ) : null}
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
          <div className="bg-gradient-to-t from-black/80 via-black/50 to-transparent pt-16 pb-5 px-5 space-y-2.5">
            <h3 className="text-sm font-bold text-white line-clamp-2 leading-snug drop-shadow-sm">
              {program.title}
            </h3>
            <p className="text-xs text-white/70 line-clamp-2">
              {program.description}
            </p>
            <div className="flex items-center justify-between gap-2 pt-1">
              <span className="flex items-center gap-1.5 text-emerald-300 text-sm font-medium">
                {t("programs.view_details")}
                <ArrowRight size={14} />
              </span>
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
            <h3 className="text-sm font-semibold text-white line-clamp-1 drop-shadow-sm">
              {program.title}
            </h3>
            <p className="text-xs text-white/60 line-clamp-1 mt-0.5">
              {program.description}
            </p>
          </div>
        </div>
      </div>
    </LocalizedLink>
  );
}
