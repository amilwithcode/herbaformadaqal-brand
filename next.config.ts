import type { NextConfig } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || "";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,
  output: "standalone",
  generateEtags: false,
  useFileSystemPublicRoutes: true,
  experimental: {
    serverActions: {
      bodySizeLimit: "2mb",
      allowedOrigins: SITE_URL ? [new URL(SITE_URL).hostname] : [],
    },
    optimizePackageImports: ["lucide-react"],
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "*.supabase.co", port: "", pathname: "/storage/**" },
      { protocol: "https", hostname: "images.unsplash.com", port: "", pathname: "/**" },
    ],
    formats: ["image/avif", "image/webp"],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2560, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
    minimumCacheTTL: 60 * 60 * 24 * 7,
    contentSecurityPolicy: "default-src 'self'; frame-ancestors 'none'; sandbox allow-same-origin allow-scripts allow-popups;",
    dangerouslyAllowSVG: false,
  },
  async headers() {
    const longImmutable = "public, max-age=31536000, immutable";
    const longStale = "public, max-age=86400, stale-while-revalidate=604800";
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-DNS-Prefetch-Control", value: "on" },
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-XSS-Protection", value: "1; mode=block" },
          { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
          { key: "Cross-Origin-Resource-Policy", value: "same-site" },
          { key: "Cross-Origin-Embedder-Policy", value: "require-corp; report-to='default'" },
          {
            key: "Permissions-Policy",
            value:
              "accelerometer=(), autoplay=(self), camera=(), encrypted-media=(self), fullscreen=(self), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), midi=(), payment=(), picture-in-picture=(self), usb=(), xr-spatial-tracking=()",
          },
          {
            key: "Link",
            value:
              '</sitemap.xml>; rel="sitemap", </robots.txt>; rel="help", </.well-known/api-catalog>; rel="api-catalog", </docs/api>; rel="service-doc"',
          },
        ],
      },
      {
        source: "/api/:path*",
        headers: [
          { key: "Cache-Control", value: "no-store, max-age=0, must-revalidate" },
          { key: "Pragma", value: "no-cache" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Content-Security-Policy", value: "default-src 'none'; frame-ancestors 'none'" },
        ],
      },
      { source: "/popup.css", headers: [{ key: "Cache-Control", value: longStale }] },
      { source: "/popup.js", headers: [{ key: "Cache-Control", value: longStale }] },
      { source: "/robots.txt", headers: [{ key: "Cache-Control", value: "public, max-age=3600, stale-while-revalidate=86400" }] },
      { source: "/ads.txt", headers: [{ key: "Cache-Control", value: "public, max-age=3600, stale-while-revalidate=86400" }] },
      { source: "/:path*.svg", headers: [{ key: "Cache-Control", value: longStale }] },
      { source: "/:path*.ico", headers: [{ key: "Cache-Control", value: longStale }] },
      { source: "/og-image.jpg", headers: [{ key: "Cache-Control", value: longStale }] },
      { source: "/logo.png", headers: [{ key: "Cache-Control", value: longStale }] },
      {
        source: "/_next/static/:path*",
        headers: [{ key: "Cache-Control", value: longImmutable }],
      },
    ];
  },
  async redirects() {
    return [
      { source: "/admin/social", destination: "/admin/social-media", permanent: true },
    ];
  },
};

export default nextConfig;
