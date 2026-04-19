import { Suspense } from "react";
import ProductIdPage from "@/app/product/[id]/page";

type Props = {
  params: Promise<{ locale: string; id: string }>;
};

export default async function Page({ params }: Props) {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Yüklənir...</div>}>
      <ProductIdPage params={params} />
    </Suspense>
  );
}
