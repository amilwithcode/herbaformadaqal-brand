import type { Metadata } from "next";
import TermsPage from "@/app/terms/page";
import { buildPageMetadata } from "@/lib/build-page-metadata";

export default TermsPage;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return buildPageMetadata({
    locale,
    pageKey: "terms",
    canonicalPath: "/terms",
    fallbackTitle: "İstifadə şərtləri",
    fallbackDescription: "Saytdan istifadə qaydaları və hüquqi şərtlər.",
  });
}
