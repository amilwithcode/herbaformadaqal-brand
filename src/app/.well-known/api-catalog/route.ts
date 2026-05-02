import { NextResponse } from "next/server";

/**
 * API Catalog (RFC 9727)
 * Avtomatlaşdırılmış agentlər üçün API resurslarını təqdim edir.
 */
export async function GET() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.herbaformadaqal.com";

  const linkset = [
    {
      anchor: `${siteUrl}/api`,
      "service-desc": [
        {
          href: `${siteUrl}/api/docs/openapi.json`,
          type: "application/openapi+json;version=3.0",
        },
      ],
      "service-doc": [
        {
          href: "https://github.com/your-repo/docs",
          type: "text/html",
        },
      ],
      status: [
        {
          href: `${siteUrl}/api/health`,
        },
      ],
    },
  ];

  return NextResponse.json({ linkset }, {
    headers: {
      "Content-Type": "application/linkset+json",
      "Cache-Control": "public, max-age=86400",
    },
  });
}
