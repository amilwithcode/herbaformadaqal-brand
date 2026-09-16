"use client";

import { ChevronRight } from "lucide-react";
import { useI18n } from "@/contexts/I18nContext";
import { LocalizedLink } from "@/components/navigation/LocalizedLink";
import { getSiteUrl } from "@/lib/site-url";

export type BreadcrumbItem = {
  label: string;
  href?: string;
};

type BreadcrumbsProps = {
  items: BreadcrumbItem[];
};

export function Breadcrumbs({ items }: BreadcrumbsProps) {
  const { t } = useI18n();

  const fullItems: BreadcrumbItem[] = [
    { label: t("breadcrumbs.home"), href: "/" },
    ...items,
  ];

  const siteUrl = getSiteUrl().replace(/\/$/, "");
  const schemaItems = fullItems.map((it, idx) => ({
    "@type": "ListItem",
    position: idx + 1,
    name: it.label,
    item: it.href ? `${siteUrl}${it.href}` : undefined,
  }));

  const schema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: schemaItems,
  };

  return (
    <>
      <nav
        aria-label={t("breadcrumbs.ariaLabel")}
        className="mx-auto max-w-6xl w-full px-6 pt-4"
      >
        <ol className="flex flex-wrap items-center gap-1 text-xs text-emerald-700">
          {fullItems.map((it, idx) => {
            const isLast = idx === fullItems.length - 1;
            return (
              <li key={`${it.label}-${idx}`} className="flex items-center gap-1">
                {idx > 0 && (
                  <ChevronRight size={12} className="text-emerald-400 shrink-0" />
                )}
                {it.href && !isLast ? (
                  <LocalizedLink
                    href={it.href}
                    className="hover:text-emerald-900 hover:underline underline-offset-2 transition-colors"
                  >
                    {it.label}
                  </LocalizedLink>
                ) : (
                  <span
                    aria-current={isLast ? "page" : undefined}
                    className={isLast ? "text-emerald-900 font-medium" : ""}
                  >
                    {it.label}
                  </span>
                )}
              </li>
            );
          })}
        </ol>
      </nav>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
    </>
  );
}

export default Breadcrumbs;
