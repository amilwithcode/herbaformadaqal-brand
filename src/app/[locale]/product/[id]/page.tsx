import ProductIdPage from "@/app/product/[id]/page";

type Props = {
  params: Promise<{ locale: string; id: string }>;
};

export default async function Page({ params }: Props) {
  return <ProductIdPage params={params} />;
}
