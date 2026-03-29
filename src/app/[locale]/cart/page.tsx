import type { Metadata } from "next";
import CartPage from "@/app/cart/page";
import { buildPageMetadata } from "@/lib/build-page-metadata";

export default CartPage;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return buildPageMetadata({
    locale,
    pageKey: "cart",
    canonicalPath: "/cart",
    fallbackTitle: "Səbət",
    fallbackDescription:
      "Seçdiyiniz məhsullar — sifarişi tamamlayın və çatdırılmanı təyin edin.",
  });
}
