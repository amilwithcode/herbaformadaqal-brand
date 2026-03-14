"use client";

import { useEffect } from "react";

const CONVERSION_ID = "AW-18011122927";
const CONVERSION_LABEL = "c8ZYCMq4jYgcEO_Zr4xD";
const STORAGE_KEY = "gads_conversion_sent";

/**
 * Fires Google Ads conversion event once per order when order is paid.
 * Use on order confirmation / thank-you page (e.g. account/orders/[id] when status is paid).
 */
export function GoogleAdsConversion({
  orderId,
  orderStatus,
}: {
  orderId: number;
  orderStatus: string;
}) {
  useEffect(() => {
    if (orderStatus !== "paid") return;

    const sentKey = `${STORAGE_KEY}_${orderId}`;
    if (typeof window === "undefined") return;
    try {
      if (sessionStorage.getItem(sentKey) === "1") return;
      sessionStorage.setItem(sentKey, "1");
    } catch {
      return;
    }

    const gtag = (window as unknown as { gtag?: (...args: unknown[]) => void })
      .gtag;
    if (typeof gtag !== "function") return;

    gtag("event", "conversion", {
      send_to: `${CONVERSION_ID}/${CONVERSION_LABEL}`,
    });
  }, [orderId, orderStatus]);

  return null;
}
