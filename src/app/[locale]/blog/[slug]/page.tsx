import BlogPostPage from "@/app/blog/[slug]/page";

export default async function LocalizedBlogPostPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { slug } = await params;
  return <BlogPostPage params={Promise.resolve({ slug })} />;
}
