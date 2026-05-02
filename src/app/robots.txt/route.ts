import { NextResponse } from "next/server";

/**
 * Dinamik robots.txt – Route Handler vasitəsilə.
 * MetadataRoute.Robots tipi məhdud olduğu üçün (custom lines dəstəkləmir), 
 * tam nəzarət üçün bu üsuldan istifadə edirik.
 */
export async function GET() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.herbaformadaqal.com";

  const robotsTxt = `User-agent: *
Allow: /
Allow: /products
Allow: /products/*
Allow: /categories/*
Allow: /blog/*
Allow: /programs
Allow: /programs/*
Allow: /about
Allow: /contact
Allow: /faq
Allow: /privacy
Allow: /shipping
Allow: /returns
Disallow: /admin
Disallow: /admin/*
Disallow: /account
Disallow: /account/*
Disallow: /auth
Disallow: /auth/*
Disallow: /api
Disallow: /api/*
Disallow: /search
Disallow: /search?*
Disallow: /cart
Disallow: /wishlist
Disallow: /_next
Disallow: /_next/*

User-agent: GPTBot
User-agent: OAI-SearchBot
User-agent: Claude-Web
User-agent: Google-Extended
Allow: /
Disallow: /admin
Disallow: /account
Disallow: /api

Content-Signal: ai-train=no, search=yes, ai-input=no

Sitemap: ${siteUrl}/sitemap.xml
Host: ${siteUrl.replace(/\/$/, "")}`;

  return new NextResponse(robotsTxt, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
    },
  });
}
