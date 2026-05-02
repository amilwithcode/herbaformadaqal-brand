import { NextResponse } from "next/server";

/**
 * Agent Skills Discovery Index (RFC v0.2.0)
 */
export async function GET() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.herbaformadaqal.com";

  const index = {
    $schema: "https://agent-skills.org/index-schema.json",
    skills: [
      {
        name: "Product Search",
        type: "api",
        description: "Herbalife məhsullarını axtarmaq və məlumat almaq üçün skill",
        url: `${siteUrl}/api/products`,
        digest: "sha256:example-digest-12345",
      },
      {
        name: "Program Advisor",
        type: "api",
        description: "İstifadəçilərə uyğun sağlamlıq proqramlarını məsləhət görmək",
        url: `${siteUrl}/api/programs`,
        digest: "sha256:example-digest-67890",
      }
    ]
  };

  return NextResponse.json(index, {
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=86400",
    },
  });
}
