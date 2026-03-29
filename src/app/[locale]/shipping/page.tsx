import type { Metadata } from "next";
import ShippingPage from "@/app/shipping/page";
import { buildPageMetadata } from "@/lib/build-page-metadata";

export default ShippingPage;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return buildPageMetadata({
    locale,
    pageKey: "shipping",
    canonicalPath: "/shipping",
    fallbackTitle: "Çatdırılma",
    fallbackDescription:
      "Çatdırılma əraziləri, müddətlər və ödəniş üsulları haqqında.",
  });
}
