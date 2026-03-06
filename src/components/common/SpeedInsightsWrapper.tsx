"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

const SpeedInsightsInner = dynamic(
  () => import("@vercel/speed-insights/next").then((m) => m.SpeedInsights),
  { ssr: false }
);

export default function SpeedInsightsWrapper() {
  const [canLoad, setCanLoad] = useState(false);

  useEffect(() => {
    // Yalnız Vercel deployment-da və ad blocker yoxdursa yüklə
    if (!process.env.NEXT_PUBLIC_VERCEL_ENV) return;

    // Script-in əlçatanlığını yoxla — bloklanıbsa sessiz keç
    fetch("/_vercel/speed-insights/script.js", { method: "HEAD" })
      .then((res) => {
        if (res.ok) setCanLoad(true);
      })
      .catch(() => {
        // Ad blocker tərəfindən bloklandı — xəta göstərmə
      });
  }, []);

  if (!canLoad) return null;
  return <SpeedInsightsInner />;
}
