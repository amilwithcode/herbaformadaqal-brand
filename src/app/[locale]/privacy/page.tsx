import type { Metadata } from "next";
import PrivacyPage from "@/app/privacy/page";
import { buildPageMetadata } from "@/lib/build-page-metadata";

export default PrivacyPage;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return buildPageMetadata({
    locale,
    pageKey: "privacy",
    canonicalPath: "/privacy",
    fallbackTitle: "Məxfilik siyasəti",
    fallbackDescription:
      "Şəxsi məlumatlarınızın toplanması, istifadəsi və qorunması haqqında.",
  });
}
