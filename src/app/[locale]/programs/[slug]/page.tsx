import ProgramSlugPage from "@/app/programs/[slug]/page";

type Props = {
  params: Promise<{ locale: string; slug: string }>;
};

export default async function Page({ params }: Props) {
  const { slug } = await params;
  return <ProgramSlugPage params={Promise.resolve({ slug })} />;
}
