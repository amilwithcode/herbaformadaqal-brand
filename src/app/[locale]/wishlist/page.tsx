import type { Metadata } from "next";
import WishlistPage from "@/app/wishlist/page";
import { buildPageMetadata } from "@/lib/build-page-metadata";

export default WishlistPage;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return buildPageMetadata({
    locale,
    pageKey: "wishlist",
    canonicalPath: "/wishlist",
    fallbackTitle: "Seçilmişlər",
    fallbackDescription:
      "Bəyəndiyiniz məhsulların siyahısı — sonra almaq üçün saxlayın.",
  });
}
