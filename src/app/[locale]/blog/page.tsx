import type { Metadata } from "next";
import BlogListPage from "@/app/blog/page";
import { buildPageMetadata } from "@/lib/build-page-metadata";

export default BlogListPage;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return buildPageMetadata({
    locale,
    pageKey: "blog",
    canonicalPath: "/blog",
    fallbackTitle: "Blog",
    fallbackDescription:
      "Sağlamlıq, qidalanma və Herbalife haqqında məqalələr və tövsiyələr.",
  });
}
