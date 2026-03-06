"use client";

import dynamic from "next/dynamic";

const SpeedInsightsInner = dynamic(
  () => import("@vercel/speed-insights/next").then((m) => m.SpeedInsights),
  { ssr: false }
);

export default function SpeedInsightsWrapper() {
  // Yalnız Vercel deployment-da yüklə (NEXT_PUBLIC_ prefix lazımdır client-də)
  if (!process.env.NEXT_PUBLIC_VERCEL_ENV) return null;
  return <SpeedInsightsInner />;
}
