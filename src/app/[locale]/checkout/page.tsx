import type { Metadata } from "next";
import CheckoutPage from "@/app/checkout/page";
import { buildPageMetadata } from "@/lib/build-page-metadata";

export default CheckoutPage;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return buildPageMetadata({
    locale,
    pageKey: "checkout",
    canonicalPath: "/checkout",
    fallbackTitle: "Checkout",
    fallbackDescription: "Kart məlumatlarını daxil edin və sifarişi təsdiqləyin.",
  });
}
