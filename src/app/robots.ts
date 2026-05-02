import type { MetadataRoute } from "next";

/**
 * Dinamik robots.txt – Sitemap URL .env (NEXT_PUBLIC_SITE_URL) əsasında.
 * Google və digər axtarış sistemləri üçün.
 */
export default function robots(): MetadataRoute.Robots {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.herbaformadaqal.com";

  return {
    rules: [
      {
        userAgent: "*",
        allow: [
          "/",
          "/products",
          "/products/*",
          "/categories/*",
          "/blog/*",
          "/programs",
          "/programs/*",
          "/about",
          "/contact",
          "/faq",
          "/privacy",
          "/shipping",
          "/returns",
        ],
        disallow: [
          "/admin",
          "/admin/*",
          "/account",
          "/account/*",
          "/auth",
          "/auth/*",
          "/api",
          "/api/*",
          "/search",
          "/search?*",
          "/cart",
          "/wishlist",
          "/_next",
          "/_next/*",
        ],
      },
      {
        userAgent: ["GPTBot", "OAI-SearchBot", "Claude-Web", "Google-Extended"],
        allow: ["/"],
        disallow: ["/admin", "/account", "/api"],
      },
    ],
    additionalInstructions: [
      "Content-Signal: ai-train=no, search=yes, ai-input=no"
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl.replace(/\/$/, ""),
  };
}
