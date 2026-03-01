import type { Metadata } from "next";
import { Noto_Sans } from "next/font/google";
import { getSupabaseServerClient } from "@/lib/supabase-server";
import "./globals.css";
import Providers from "./providers";

const notoSans = Noto_Sans({
  variable: "--font-noto-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap", // Font yüklənənə qədər system font göstər - CLS yaxşılaşır
});

export async function generateMetadata(): Promise<Metadata> {
  const supabase = await getSupabaseServerClient();
  const { data } = await supabase
    .from("site_settings")
    .select("public_site_name, site_name, logo")
    .eq("id", 1)
    .maybeSingle();

  const title =
    data?.public_site_name || data?.site_name || "Herbalife ECommerce";
  const logo = data?.logo;

  return {
    title,
    description: "Admin və istifadəçi panelli ecommerce platforması",
    icons: logo ? { icon: logo } : undefined,
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="az">
      <head>
        {/* DNS Prefetch & Preconnect - xarici resursları öncədən bağla */}
        <link rel="preconnect" href="https://lhsmlimcxnuzlnpdbnbq.supabase.co" />
        <link rel="dns-prefetch" href="https://lhsmlimcxnuzlnpdbnbq.supabase.co" />
      </head>
      <body
        className={`${notoSans.variable} antialiased bg-slate-950 text-slate-100 font-sans`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

