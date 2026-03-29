import type { Metadata } from "next";
import ReturnsPage from "@/app/returns/page";
import { buildPageMetadata } from "@/lib/build-page-metadata";

export default ReturnsPage;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return buildPageMetadata({
    locale,
    pageKey: "returns",
    canonicalPath: "/returns",
    fallbackTitle: "Geri qaytarma",
    fallbackDescription:
      "Məhsul geri qaytarma və dəyişdirmə qaydaları haqqında məlumat.",
  });
}
