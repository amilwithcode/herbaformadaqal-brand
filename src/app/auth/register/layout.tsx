import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/build-page-metadata";

export async function generateMetadata(): Promise<Metadata> {
  return buildPageMetadata({
    locale: "az",
    pageKey: "register",
    canonicalPath: "/auth/register",
    fallbackTitle: "Qeydiyyat",
    fallbackDescription:
      "Yeni hesab yaradın və Herbalife məhsullarını rahat sifariş edin.",
    omitLocaleInCanonical: true,
  });
}

export default function RegisterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
