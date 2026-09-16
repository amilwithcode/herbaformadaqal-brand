import type { Metadata } from "next";
import DisclaimerPage from "@/app/disclaimer/page";
import { buildPageMetadata } from "@/lib/build-page-metadata";

export default DisclaimerPage;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return buildPageMetadata({
    locale,
    pageKey: "disclaimer",
    canonicalPath: "/disclaimer",
    fallbackTitle: "Disclaimer",
    fallbackDescription:
      "General wellness and informational disclaimers applicable to the content on this website.",
  });
}
