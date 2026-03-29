import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/build-page-metadata";

export async function generateMetadata(): Promise<Metadata> {
  return buildPageMetadata({
    locale: "az",
    pageKey: "login",
    canonicalPath: "/auth/login",
    fallbackTitle: "Giriş",
    fallbackDescription:
      "Hesabınıza daxil olun — sifarişlərinizi və profilinizi idarə edin.",
    omitLocaleInCanonical: true,
  });
}

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
