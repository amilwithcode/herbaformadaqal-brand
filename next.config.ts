import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Statik JS/CSS uzun müddət keşlənir — xarici ölkələrdən sürət (Speed Insights)
  async headers() {
    const longImmutable = "public, max-age=31536000, immutable";
    const longStale = "public, max-age=86400, stale-while-revalidate=604800"; // 1 gün + 7 gün SWR
    return [
      { source: "/_next/static/:path*", headers: [{ key: "Cache-Control", value: longImmutable }] },
      { source: "/popup.css", headers: [{ key: "Cache-Control", value: longStale }] },
      { source: "/popup.js", headers: [{ key: "Cache-Control", value: longStale }] },
      { source: "/robots.txt", headers: [{ key: "Cache-Control", value: "public, max-age=3600, stale-while-revalidate=86400" }] },
      { source: "/:path*.svg", headers: [{ key: "Cache-Control", value: longStale }] },
      { source: "/:path*.ico", headers: [{ key: "Cache-Control", value: longStale }] },
      { source: "/og-image.jpg", headers: [{ key: "Cache-Control", value: longStale }] },
      { source: "/logo.png", headers: [{ key: "Cache-Control", value: longStale }] },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lhsmlimcxnuzlnpdbnbq.supabase.co",
      },
      {
        protocol: "https",
        hostname: "*.supabase.co",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      }
    ],
    // Şəkil optimallaşdırma: WebP/AVIF formatlarını dəstəklə (daha kiçik ölçü)
    formats: ["image/avif", "image/webp"],
    // Lazım olan ölçülər - gərəksiz şəkil variantları yaratmasın
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
    // Xarici CDN/edge üçün uzun keş — başqa ölkələrdən sürətli şəkil çəkilişi
    minimumCacheTTL: 60 * 60 * 24 * 7, // 7 gün
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "5mb",
    },
    // Paket optimallaşdırması - lazım olan modulları ağac silkələməsi ilə kiçilt
    optimizePackageImports: ["lucide-react"],
  },
  // Sıxılma aktiv et
  compress: true,
  // Köhnə sosial URL-i yeni marşruta yönləndir
  async redirects() {
    return [
      { source: "/admin/social", destination: "/admin/social-media", permanent: true },
    ];
  },
};

export default nextConfig;
