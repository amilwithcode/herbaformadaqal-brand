"use client";

import Link from "next/link";
import { useI18n } from "@/contexts/I18nContext";
import { getLocalizedPath } from "@/lib/localized-path";
import type { ComponentProps } from "react";

type LocalizedLinkProps = Omit<ComponentProps<typeof Link>, "href"> & {
  href: string;
};

/**
 * Cari dilə uyğun href ilə Link. Məs: href="/products" -> /en/products (locale en olduqda).
 */
export function LocalizedLink({ href, ...rest }: LocalizedLinkProps) {
  const { locale } = useI18n();
  const localizedHref = getLocalizedPath(href, locale);
  return <Link href={localizedHref} {...rest} />;
}
