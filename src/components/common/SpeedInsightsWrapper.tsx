"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

const SpeedInsightsInner = dynamic(
  () =>
    import("@vercel/speed-insights/next")
      .then((m) => m.SpeedInsights)
      .catch(() => () => null),
  { ssr: false }
);

const isProd = process.env.NODE_ENV === "production";

export default function SpeedInsightsWrapper() {
  const [canLoad, setCanLoad] = useState(isProd);

  useEffect(() => {
    if (!isProd) return;
    const t = window.setTimeout(() => setCanLoad(true), 100);
    return () => clearTimeout(t);
  }, []);

  if (!canLoad) return null;
  return <SpeedInsightsInner />;
}
