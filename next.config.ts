import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  transpilePackages: ["@vercel/speed-insights"],
  // Statik JS/CSS uzun müddət keşlənir — başqa ölkələrdən təkrar ziyarətdə sürət
  async headers() {
    return [
      {
        source: "/_next/static/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
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
    // Şəkilləri bir müddət keşlə
    minimumCacheTTL: 60 * 60 * 24, // 24 saat
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
