"use client";

import { useI18n } from "@/contexts/I18nContext";

export default function BenefitsStrip({ sectionData }: { sectionData?: any }) {
  const { t } = useI18n();

  const benefits = [
    { icon: "👤", title: sectionData?.item1_title || t("home.benefits.personal_consultant") },
    { icon: "⚗️", title: sectionData?.item2_title || t("home.benefits.scientific_approach") },
    { icon: "🏭", title: sectionData?.item3_title || t("home.benefits.own_production") },
    { icon: "🛡️", title: sectionData?.item4_title || t("home.benefits.quality_guarantee") }, // Assuming item4 exists or using fallback
    { icon: "🎓", title: sectionData?.item5_title || t("home.benefits.experienced_experts") }, // Assuming item5 exists or using fallback
  ];
  
  // Only first 3 are currently editable in admin, but we can map whatever exists
  const item1 = { title: sectionData?.item1_title || t("home.benefits.personal_consultant"), desc: sectionData?.item1_desc };
  const item2 = { title: sectionData?.item2_title || t("home.benefits.scientific_approach"), desc: sectionData?.item2_desc };
  const item3 = { title: sectionData?.item3_title || t("home.benefits.own_production"), desc: sectionData?.item3_desc };

  return (
    <div className="rounded-3xl border border-emerald-100 bg-[#e6f3ec] px-6 py-3">
      <div className="flex flex-wrap items-center justify-between gap-4 text-xs md:text-sm text-emerald-900">
        <div className="flex items-center gap-2">
          <span className="text-lg">👤</span>
          <span>{item1.title}</span>
        </div>
        <div className="flex items-center gap-2 border-l border-emerald-500 pl-4">
          <span className="text-lg">⚗️</span>
          <span>{item2.title}</span>
        </div>
        <div className="flex items-center gap-2 border-l border-emerald-500 pl-4">
          <span className="text-lg">🏭</span>
          <span>{item3.title}</span>
        </div>
        <div className="flex items-center gap-2 border-l border-emerald-500 pl-4">
          <span className="text-lg">🛡️</span>
          <span>{t("home.benefits.quality_guarantee")}</span>
        </div>
        <div className="flex items-center gap-2 border-l border-emerald-500 pl-4">
          <span className="text-lg">🎓</span>
          <span>{t("home.benefits.experienced_experts")}</span>
        </div>
      </div>
    </div>
  );
}

