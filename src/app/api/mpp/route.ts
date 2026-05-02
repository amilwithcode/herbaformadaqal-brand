import { NextResponse } from "next/server";

/**
 * Machine Payment Protocol (MPP) Discovery / OpenAPI Extensions
 */
export async function GET() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.herbaformadaqal.com";

  const openapiMpp = {
    openapi: "3.0.0",
    info: {
      title: "Herbaformadaqal MPP API",
      version: "1.0.0",
    },
    paths: {
      "/api/checkout": {
        post: {
          summary: "Checkout with MPP support",
          "x-payment-info": {
            intent: "charge",
            methods: ["stripe", "card"],
            currency: "AZN",
            facilitator_url: `${siteUrl}/api/payments/facilitator`,
          }
        }
      }
    }
  };

  return NextResponse.json(openapiMpp, {
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=86400",
    },
  });
}
