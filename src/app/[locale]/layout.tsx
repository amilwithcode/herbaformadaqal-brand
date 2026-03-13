import { redirect } from "next/navigation";
import { locales, defaultLocale, type Locale } from "@/modules/i18n/config";
import LocaleSync from "@/components/navigation/LocaleSync";

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const validLocale = locales.includes(locale as Locale) ? (locale as Locale) : null;

  if (!validLocale) {
    redirect(`/${defaultLocale}`);
  }

  return (
    <>
      <LocaleSync locale={validLocale} />
      {children}
    </>
  );
}
