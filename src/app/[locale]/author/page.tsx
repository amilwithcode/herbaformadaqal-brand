import type { Metadata } from "next";
import AuthorPage from "@/app/author/page";
import { buildPageMetadata } from "@/lib/build-page-metadata";

export default AuthorPage;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return buildPageMetadata({
    locale,
    pageKey: "author",
    canonicalPath: "/author",
    fallbackTitle: "About the Author",
    fallbackDescription:
      "Information about the operator of this website and the content team.",
  });
}
