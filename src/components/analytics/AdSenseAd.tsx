"use client";

import { useEffect } from "react";

interface AdSenseAdProps {
  adSlot: string;
  adFormat?: string;
  adLayoutKey?: string;
  style?: React.CSSProperties;
}

export function AdSenseAd({
  adSlot,
  adFormat,
  adLayoutKey,
  style = { display: "block" },
}: AdSenseAdProps) {
  useEffect(() => {
    try {
      (window as any).adsbygoogle = (window as any).adsbygoogle || [];
      (window as any).adsbygoogle.push({});
    } catch (err) {
      console.error("AdSense error:", err);
    }
  }, []);

  const insProps: React.HTMLAttributes<HTMLElement> & Record<string, unknown> = {
    className: "adsbygoogle",
    style,
    "data-ad-client": "ca-pub-6351848176041276",
    "data-ad-slot": adSlot,
  };

  if (adFormat) {
    insProps["data-ad-format"] = adFormat;
  }

  if (adLayoutKey) {
    insProps["data-ad-layout-key"] = adLayoutKey;
  }

  return <ins {...insProps} />;
}
