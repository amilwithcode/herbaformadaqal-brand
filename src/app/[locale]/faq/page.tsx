import type { Metadata } from "next";
import FaqPage from "@/app/faq/page";
import { buildPageMetadata } from "@/lib/build-page-metadata";

export default FaqPage;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return buildPageMetadata({
    locale,
    pageKey: "faq",
    canonicalPath: "/faq",
    fallbackTitle: "Tez-tez verilən suallar",
    fallbackDescription:
      "Çatdırılma, ödəniş və məhsullar haqqında ən çox verilən sualların cavabları.",
  });
}
