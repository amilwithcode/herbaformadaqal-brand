import type { Metadata } from "next";
import EditorialPolicyPage from "@/app/editorial-policy/page";
import { buildPageMetadata } from "@/lib/build-page-metadata";

export default EditorialPolicyPage;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return buildPageMetadata({
    locale,
    pageKey: "editorial-policy",
    canonicalPath: "/editorial-policy",
    fallbackTitle: "Editorial Policy",
    fallbackDescription:
      "How content on this website is prepared, reviewed, updated, and corrected.",
  });
}
