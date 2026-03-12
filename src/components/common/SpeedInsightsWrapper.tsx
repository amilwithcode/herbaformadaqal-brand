"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

const SpeedInsightsInner = dynamic(
  () => import("@vercel/speed-insights/next").then((m) => m.SpeedInsights),
  { ssr: false }
);

const isProd = process.env.NODE_ENV === "production";

export default function SpeedInsightsWrapper() {
  // Production-da dərhal yüklə — bütün ölkələrdən (o cümlədən uzaq regionlardan) Web Vitals məlumatı toplansın
  const [canLoad, setCanLoad] = useState(isProd);

  useEffect(() => {
    if (!isProd) return;
    // Artıq true ola bilər; HEAD yalnız əlavə yoxlama üçün (bloklanıbsa script özü uğursuz olar)
    const t = window.setTimeout(() => setCanLoad(true), 100);
    return () => clearTimeout(t);
  }, []);

  if (!canLoad) return null;
  return <SpeedInsightsInner />;
}
