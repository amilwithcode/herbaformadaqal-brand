import { redirect } from "next/navigation";
import { getLocaleFromHeaders } from "@/lib/locale-from-headers";

/**
 * Root "/" üçün: brauzer dilinə yönləndir.
 * Əksər hallarda middleware artıq / -> /{locale} edir; bu ehtiyatdır (404 qarşısı).
 */
export default async function RootPage() {
  const locale = await getLocaleFromHeaders();
  redirect(`/${locale}`);
}
