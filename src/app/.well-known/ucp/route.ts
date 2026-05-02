import { NextResponse } from "next/server";

/**
 * Universal Commerce Protocol (UCP) Discovery
 */
export async function GET() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.herbaformadaqal.com";

  const ucpProfile = {
    version: "1.0",
    services: [
      {
        id: "commerce-service",
        type: "product-catalog",
        capabilities: ["search", "checkout", "cart"],
        endpoints: {
          products: `${siteUrl}/api/products`,
          checkout: `${siteUrl}/api/checkout`,
        }
      }
    ],
    schemas: {
      product: `${siteUrl}/schemas/product.json`,
      order: `${siteUrl}/schemas/order.json`
    }
  };

  return NextResponse.json(ucpProfile, {
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=86400",
    },
  });
}
