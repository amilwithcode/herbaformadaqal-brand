"use client";

import { useEffect, useState } from "react";
import { ADSENSE_PUBLISHER_ID } from "@/lib/site-url";

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
  const [shouldRender, setShouldRender] = useState(false);
  const [pushed, setPushed] = useState(false);

  useEffect(() => {
    const host = window.location.hostname;
    const allowedHosts = [
      "www.herbaformadaqal.com",
      "herbaformadaqal.com",
    ];
    setShouldRender(
      allowedHosts.includes(host) ||
        host.includes("vercel.app") ||
        process.env.NODE_ENV === "development"
    );
  }, []);

  useEffect(() => {
    if (!shouldRender || pushed) return;
    let attempts = 0;
    const maxAttempts = 50;

    const tryPush = () => {
      attempts++;
      const win = window as any;
      if (typeof win.adsbygoogle !== "undefined") {
        try {
          win.adsbygoogle.push({});
          setPushed(true);
        } catch (err) {
          console.error("AdSense push error:", err);
        }
      } else if (attempts < maxAttempts) {
        setTimeout(tryPush, 200);
      }
    };

    tryPush();

    return () => {
      attempts = maxAttempts;
    };
  }, [shouldRender, pushed]);

  if (!shouldRender) return null;

  const insProps: React.HTMLAttributes<HTMLElement> & Record<string, unknown> = {
    className: "adsbygoogle",
    style,
    "data-ad-client": ADSENSE_PUBLISHER_ID,
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
