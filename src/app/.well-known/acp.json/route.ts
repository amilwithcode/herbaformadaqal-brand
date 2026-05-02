import { NextResponse } from "next/server";

/**
 * Agentic Commerce Protocol (ACP) Discovery Metadata
 * Sİ agentlərinə ticarət API-sini kəşf etməyə imkan verir.
 */
export async function GET() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.herbaformadaqal.com";

  const acpDiscovery = {
    protocol: {
      name: "acp",
      version: "1.0.0",
    },
    api_base_url: `${siteUrl}/api`,
    supported_transports: ["http", "https"],
    capabilities: {
      services: [
        {
          id: "catalog",
          name: "Product Catalog",
          description: "Məhsul siyahısı və axtarışı",
          endpoint: "/products",
        },
        {
          id: "cart",
          name: "Shopping Cart",
          description: "Səbət idarəetməsi",
          endpoint: "/cart",
        },
        {
          id: "checkout",
          name: "Checkout",
          description: "Sifarişin tamamlanması",
          endpoint: "/checkout",
        }
      ],
    },
  };

  return NextResponse.json(acpDiscovery, {
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=86400",
    },
  });
}
