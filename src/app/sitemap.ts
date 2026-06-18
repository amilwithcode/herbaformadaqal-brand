import { MetadataRoute } from 'next';
import { getSupabaseServerClient } from '@/lib/supabase-server';
import { getCategories } from '@/modules/products/queries';
import { getSiteUrl } from '@/lib/site-url';

const LOCALES = ['az', 'en', 'ru', 'tr'];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = getSiteUrl();
  const supabase = await getSupabaseServerClient();
  
  const staticPaths = [
    { path: '', priority: 1.0, changeFrequency: 'daily' as const },
    { path: '/products', priority: 0.9, changeFrequency: 'daily' as const },
    { path: '/programs', priority: 0.8, changeFrequency: 'weekly' as const },
    { path: '/about', priority: 0.7, changeFrequency: 'monthly' as const },
    { path: '/contact', priority: 0.7, changeFrequency: 'monthly' as const },
    { path: '/faq', priority: 0.6, changeFrequency: 'monthly' as const },
    { path: '/blog', priority: 0.8, changeFrequency: 'weekly' as const },
  ];

  // Static pages for all locales
  const staticPages: MetadataRoute.Sitemap = [];
  staticPaths.forEach(({ path, priority, changeFrequency }) => {
    LOCALES.forEach((locale) => {
      staticPages.push({
        url: `${siteUrl}/${locale}${path}`,
        lastModified: new Date(),
        changeFrequency,
        priority,
      });
    });
  });

  // Categories for all locales
  let categoryPages: MetadataRoute.Sitemap = [];
  try {
    const categories = await getCategories();
    categories.forEach((cat) => {
      LOCALES.forEach((locale) => {
        categoryPages.push({
          url: `${siteUrl}/${locale}/categories/${cat.slug}`,
          lastModified: new Date(),
          changeFrequency: 'weekly',
          priority: 0.8,
        });
      });
    });
  } catch (e) {
    console.error('Sitemap categories error:', e);
  }

  // Products for all locales
  let productPages: MetadataRoute.Sitemap = [];
  try {
    const { data: products } = await supabase
      .from('products')
      .select('slug, updated_at')
      .eq('is_active', true);
    
    (products || []).forEach((product) => {
      LOCALES.forEach((locale) => {
        productPages.push({
          url: `${siteUrl}/${locale}/products/${product.slug}`,
          lastModified: product.updated_at ? new Date(product.updated_at) : new Date(),
          changeFrequency: 'weekly',
          priority: 0.9,
        });
      });
    });
  } catch (e) {
    console.error('Sitemap products error:', e);
  }

  // Blog posts for all locales
  let blogPages: MetadataRoute.Sitemap = [];
  try {
    const { data: posts } = await supabase
      .from('content_posts')
      .select('slug, updated_at')
      .eq('is_published', true);
    
    (posts || []).forEach((post) => {
      LOCALES.forEach((locale) => {
        blogPages.push({
          url: `${siteUrl}/${locale}/blog/${post.slug}`,
          lastModified: post.updated_at ? new Date(post.updated_at) : new Date(),
          changeFrequency: 'monthly',
          priority: 0.7,
        });
      });
    });
  } catch (e) {
    console.error('Sitemap blog error:', e);
  }

  return [...staticPages, ...categoryPages, ...productPages, ...blogPages];
}
