import type { Metadata } from "next";
import CookiePolicyPage from "@/app/cookie-policy/page";
import { buildPageMetadata } from "@/lib/build-page-metadata";

export default CookiePolicyPage;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return buildPageMetadata({
    locale,
    pageKey: "cookie-policy",
    canonicalPath: "/cookie-policy",
    fallbackTitle: "Cookie Policy",
    fallbackDescription:
      "Information about how cookies and similar technologies are used on this website.",
  });
}
