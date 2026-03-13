import { getSupabaseServerClient } from "@/lib/supabase-server";
import { maskUserName } from "@/lib/mask-name";
import type { Category, Product, ProductVariant } from "./types";

export async function getHomeProducts() {
  const supabase = await getSupabaseServerClient();
  const { data } = await supabase
    .from("products")
    .select("*")
    .eq("is_active", true)
    .limit(12);
  
  const products = (data || []) as Product[];
  return await enrichProductsWithTranslationsAndRatings(products);
}

export async function getBrowseProducts() {
  const supabase = await getSupabaseServerClient();
  const { data } = await supabase
    .from("products")
    .select("*")
    .eq("is_active", true)
    .order("id");
  
  const products = (data || []) as Product[];
  return await enrichProductsWithTranslationsAndRatings(products);
}

export async function getProductBySlug(slug: string) {
  const supabase = await getSupabaseServerClient();
  const { data: product } = await supabase
    .from("products")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  if (!product) return null;

  const [translationsResult, imagesResult, reviewsResult, campaignsResult] = await Promise.all([
    supabase
      .from("translations")
      .select("*")
      .eq("entity_table", "products")
      .eq("entity_id", product.id),
    supabase
      .from("product_images")
      .select("*")
      .eq("product_id", product.id)
      .order("position"),
    supabase
      .from("reviews")
      .select("*")
      .eq("product_id", product.id)
      .order("created_at", { ascending: false }),
    // Aktiv kampaniyaları gətir
    supabase
      .from("campaign_products")
      .select(`
        discount_percent,
        campaigns (
          id,
          slug,
          campaign_type,
          starts_at,
          ends_at,
          is_active
        )
      `)
      .eq("product_id", product.id),
  ]);

  const rawReviews = (reviewsResult.data || []) as { user_id?: string; [key: string]: unknown }[];
  const reviewCount = rawReviews.length;
  const ratingSum = rawReviews.reduce((acc, r) => acc + (r.rating as number), 0);
  const ratingAverage = reviewCount > 0 ? ratingSum / reviewCount : 0;

  // Rəy sahiblərinin profillərini götürüb adları şifrələnmiş formada əlavə et
  const userIds = [...new Set(rawReviews.map((r) => r.user_id).filter(Boolean))] as string[];
  const profiles: Record<string, { full_name?: string | null }> = {};
  if (userIds.length > 0) {
    const { data: profilesData } = await supabase
      .from("profiles")
      .select("id, full_name")
      .in("id", userIds);
    (profilesData || []).forEach((p: { id: string; full_name?: string | null }) => {
      profiles[p.id] = { full_name: p.full_name };
    });
  }
  const reviews = rawReviews.map((r) => ({
    ...r,
    user_display_name_masked: maskUserName(profiles[r.user_id!]?.full_name ?? "İstifadəçi"),
  }));

  // Aktiv kampaniyaları filtrlə
  const now = new Date();
  const activeCampaigns = (campaignsResult.data || [])
    .filter((cp: any) => {
      const campaign = cp.campaigns;
      if (!campaign || !campaign.is_active) return false;
      if (campaign.starts_at && new Date(campaign.starts_at) > now) return false;
      if (campaign.ends_at && new Date(campaign.ends_at) < now) return false;
      return true;
    })
    .map((cp: any) => ({
      id: cp.campaigns.id,
      slug: cp.campaigns.slug,
      campaign_type: cp.campaigns.campaign_type,
      discount_percent: Number(cp.discount_percent) || 0,
    }));

  // Ən yüksək endirim faizini tap
  const maxCampaignDiscount = activeCampaigns.length > 0
    ? Math.max(...activeCampaigns.map((c: any) => c.discount_percent))
    : 0;

  // Məhsulun öz endirimi ilə kampaniya endirmini birləşdir
  const productDiscount = Number(product.discount_percent) || 0;
  const totalDiscount = Math.max(productDiscount, maxCampaignDiscount);

  return {
    ...product,
    translations: translationsResult.data || [],
    product_images: imagesResult.data || [],
    reviews,
    rating_average: ratingAverage,
    review_count: reviewCount,
    campaigns: activeCampaigns,
    effective_discount_percent: totalDiscount > productDiscount ? totalDiscount : productDiscount,
  } as Product & { campaigns?: any[]; effective_discount_percent?: number };
}

export async function getProductVariants(productId: number) {
  const supabase = await getSupabaseServerClient();
  const { data } = await supabase
    .from("product_variants")
    .select("*")
    .eq("product_id", productId);
  return (data || []) as ProductVariant[];
}

const CATEGORY_LOCALES = ["az", "en", "tr", "ru"] as const;

export async function getCategories(locale?: string) {
  const supabase = await getSupabaseServerClient();
  const { data } = await supabase.from("categories").select("*").order("id");
  const rows = data || [];

  const safeLocale = locale && (CATEGORY_LOCALES as readonly string[]).includes(locale) ? locale : "az";

  let nameByCategoryId: Map<number, string> = new Map();
  if (rows.length > 0 && safeLocale !== "az") {
    const ids = rows.map((r: any) => r.id);
    const { data: translations } = await supabase
      .from("translations")
      .select("entity_id, value")
      .eq("entity_table", "categories")
      .eq("field", "name")
      .eq("language", safeLocale)
      .in("entity_id", ids);
    if (translations) {
      translations.forEach((t: any) => nameByCategoryId.set(Number(t.entity_id), t.value));
    }
  }

  return rows.map((cat: any) => {
    const slug = cat.slug || (cat.name ? cat.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') : `category-${cat.id}`);
    const baseName = cat.name || slug.split("-").map((s: string) => s.charAt(0).toUpperCase() + s.slice(1)).join(" ");
    const name = (safeLocale !== "az" && nameByCategoryId.get(cat.id)) || baseName;
    return {
      ...cat,
      slug,
      name,
    };
  }) as Category[];
}

export async function getCategoryBySlug(slug: string, locale?: string) {
  const supabase = await getSupabaseServerClient();
  const decodedSlug = decodeURIComponent(slug);

  const { data } = await supabase
    .from("categories")
    .select("*")
    .eq("slug", decodedSlug)
    .maybeSingle();

  let category = data;
  if (!category) {
    const { data: allCategories } = await supabase.from("categories").select("*");
    category = (allCategories || []).find((c: any) => {
      const dbSlug = c.slug || (c.name ? c.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') : '');
      return dbSlug === decodedSlug || dbSlug === slug || decodeURIComponent(dbSlug) === decodedSlug;
    }) || null;
  }
  if (!category) return null;

  const baseName = category.name || (category.slug || "").split("-").map((s: string) => s.charAt(0).toUpperCase() + s.slice(1)).join(" ");
  let name = baseName;
  const safeLocale = locale && (CATEGORY_LOCALES as readonly string[]).includes(locale) ? locale : "az";
  if (safeLocale !== "az") {
    const { data: tr } = await supabase
      .from("translations")
      .select("value")
      .eq("entity_table", "categories")
      .eq("entity_id", category.id)
      .eq("field", "name")
      .eq("language", safeLocale)
      .maybeSingle();
    if (tr?.value) name = tr.value;
  }

  return { ...category, name } as Category;
}

export async function getCategoryById(id: number) {
  const supabase = await getSupabaseServerClient();
  
  if (!id || isNaN(id)) {
    console.error("getCategoryById: Invalid id provided:", id);
    return null;
  }
  
  // Try direct lookup first
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  
  if (error) {
    console.error("getCategoryById error:", error);
    return null;
  }
    
  if (data) {
    // Ensure name and slug exist
    const slug = data.slug || (data.name ? data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') : `category-${data.id}`);
    const name = data.name || (data.slug ? data.slug.split("-").map((s: string) => s.charAt(0).toUpperCase() + s.slice(1)).join(" ") : `Category ${data.id}`);
    
    return {
      ...data,
      slug,
      name,
    } as Category;
  }

  // Fallback: Fetch all and find match (handles cases where query fails)
  const { data: allCategories, error: allError } = await supabase.from("categories").select("*");
  
  if (allError) {
    console.error("getCategoryById - fetch all error:", allError);
    return null;
  }
  
  const match = (allCategories || []).find((c: any) => c.id === id);
  
  if (match) {
    // Ensure name and slug exist
    const slug = match.slug || (match.name ? match.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') : `category-${match.id}`);
    const name = match.name || (match.slug ? match.slug.split("-").map((s: string) => s.charAt(0).toUpperCase() + s.slice(1)).join(" ") : `Category ${match.id}`);
    
    return {
      ...match,
      slug,
      name,
    } as Category;
  }
  
  console.warn("getCategoryById: Category not found with id:", id);
  return null;
}

export async function getProductsByCategory(categoryId: number) {
  const supabase = await getSupabaseServerClient();
  
  const allProductIds = new Set<number>();
  
  // 1. product_categories cədvəlindən məhsul ID-lərini gətir (əgər cədvəl mövcuddursa)
  try {
    const { data: productCategories, error: pcError } = await supabase
      .from("product_categories")
      .select("product_id")
      .eq("category_id", categoryId);
    
    // Əgər error yoxdursa və data varsa, istifadə et
    if (!pcError && productCategories) {
      productCategories.forEach((pc: any) => {
        if (pc.product_id) {
          allProductIds.add(pc.product_id);
        }
      });
    }
  } catch (err) {
    // product_categories cədvəli mövcud deyilsə, error ignore et
    console.log("product_categories table may not exist, using category_id only");
  }
  
  // 2. category_id ilə məhsulları gətir (fallback və ya əlavə)
  const { data: productsByCategoryId, error: catError } = await supabase
    .from("products")
    .select("id")
    .eq("category_id", categoryId)
    .eq("is_active", true);
  
  if (!catError && productsByCategoryId) {
    productsByCategoryId.forEach((p: any) => {
      if (p.id) {
        allProductIds.add(p.id);
      }
    });
  }
  
  // Əgər heç bir məhsul tapılmadısa, boş array qaytar
  if (allProductIds.size === 0) {
    return [];
  }
  
  // 3. Bütün məhsulları gətir (yalnız aktiv olanlar)
  const { data: products, error: productsError } = await supabase
    .from("products")
    .select("*")
    .in("id", Array.from(allProductIds))
    .eq("is_active", true);
  
  if (productsError) {
    console.error("Error fetching products by category:", productsError);
    return [];
  }
  
  return await enrichProductsWithTranslationsAndRatings((products || []) as Product[]);
}

export async function getPrograms() {
  const supabase = await getSupabaseServerClient();
  const { data } = await supabase
    .from("programs")
    .select("id, title, description, image_url, duration, price, slug, is_active")
    .eq("is_active", true)
    .order("created_at", { ascending: false });
    
  return data || [];
}

export async function searchProducts(query: string) {
  if (!query || !query.trim()) {
    return [];
  }

  const supabase = await getSupabaseServerClient();
  const trimmedQuery = query.trim();
  // Case-insensitive axtarış üçün % əlavə et (ilike PostgreSQL-də case-insensitive-dir)
  const searchTerm = `%${trimmedQuery}%`;

  // 1. Products cədvəlində axtarış (slug, name, description) - ilike case-insensitive-dir
  // Amma əmin olmaq üçün həm böyük, həm də kiçik hərflə axtaraq
  const { data: productsByDirectMatch } = await supabase
    .from("products")
    .select("*")
    .eq("is_active", true)
    .or(`slug.ilike.${searchTerm},name.ilike.${searchTerm},description.ilike.${searchTerm}`);

  // 2. Translations cədvəlində axtarış (title və description field-ləri) - ilike case-insensitive-dir
  // Amma əmin olmaq üçün həm böyük, həm də kiçik hərflə axtaraq
  const { data: translations } = await supabase
    .from("translations")
    .select("entity_id")
    .eq("entity_table", "products")
    .in("field", ["title", "description"])
    .ilike("value", searchTerm);

  // 3. Translations-də tapılan məhsul ID-lərini götür
  const productIdsFromTranslations = translations
    ? [...new Set(translations.map((t) => t.entity_id))]
    : [];

  // 4. Bu ID-lərə görə məhsulları gətir
  let productsByTranslation: Product[] = [];
  if (productIdsFromTranslations.length > 0) {
    const { data: productsFromTranslations } = await supabase
      .from("products")
      .select("*")
      .eq("is_active", true)
      .in("id", productIdsFromTranslations);
    
    productsByTranslation = (productsFromTranslations || []) as Product[];
  }

  // 5. Hər iki nəticəni birləşdir və unique məhsulları götür
  const allProducts = [
    ...(productsByDirectMatch || []),
    ...productsByTranslation,
  ] as Product[];

  // 6. Duplicate məhsulları sil (id-yə görə)
  const uniqueProducts = Array.from(
    new Map(allProducts.map((p) => [p.id, p])).values()
  );

  // 7. Limit tətbiq et
  const limitedProducts = uniqueProducts.slice(0, 50);

  return await enrichProductsWithTranslationsAndRatings(limitedProducts);
}

export async function getRecommendedProducts(limit = 4) {
  const supabase = await getSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  let recommendedProducts: Product[] = [];

  if (user) {
    // Get last viewed products by this user
    const { data: views } = await supabase
      .from("product_views")
      .select("product_id")
      .eq("user_id", user.id)
      .order("viewed_at", { ascending: false })
      .limit(5);

    if (views && views.length > 0) {
      const viewedProductIds = views.map((v) => v.product_id);

      // Get categories of these viewed products
      // We need to fetch the products first to know their categories
      const { data: viewedProductsDetails } = await supabase
        .from("products")
        .select("category_id")
        .in("id", viewedProductIds);

      const categoryIds = viewedProductsDetails
        ?.map((p) => p.category_id)
        .filter((id): id is number => id !== null) || [];
      
      const uniqueCategoryIds = Array.from(new Set(categoryIds));

      if (uniqueCategoryIds.length > 0) {
        // Fetch products from these categories
        const { data: products } = await supabase
          .from("products")
          .select("*")
          .in("category_id", uniqueCategoryIds)
          .eq("is_active", true)
          .limit(limit);

        if (products) {
          recommendedProducts = products as Product[];
        }
      }
    }
  }

  // If we don't have enough recommendations (or user not logged in), fetch popular/random products
  if (recommendedProducts.length < limit) {
    const needed = limit - recommendedProducts.length;
    // For now, just fetch latest active products as fallback
    const { data: fallbackProducts } = await supabase
      .from("products")
      .select("*")
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(needed + 5); // Fetch a bit more to avoid duplicates

    if (fallbackProducts) {
      const existingIds = new Set(recommendedProducts.map((p) => p.id));
      const newProducts = (fallbackProducts as Product[])
        .filter((p) => !existingIds.has(p.id))
        .slice(0, needed);
      
      recommendedProducts = [...recommendedProducts, ...newProducts];
    }
  }

  return await enrichProductsWithRatings(recommendedProducts);
}

export async function getMostViewedProducts(excludeProductId?: number, limit = 8) {
  const supabase = await getSupabaseServerClient();

  // Count views per product from the product_views table
  const { data: viewCounts } = await supabase
    .from("product_views")
    .select("product_id");

  if (!viewCounts || viewCounts.length === 0) {
    // Fallback: return popular products by created_at
    const { data } = await supabase
      .from("products")
      .select("*")
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(limit + 1);
    const products = ((data || []) as Product[]).filter(p => p.id !== excludeProductId).slice(0, limit);
    return await enrichProductsWithTranslationsAndRatings(products);
  }

  // Count views per product
  const countMap = new Map<number, number>();
  viewCounts.forEach((v: any) => {
    countMap.set(v.product_id, (countMap.get(v.product_id) || 0) + 1);
  });

  // Sort by view count descending
  const sortedIds = Array.from(countMap.entries())
    .sort((a, b) => b[1] - a[1])
    .filter(([pid]) => pid !== excludeProductId)
    .slice(0, limit)
    .map(([pid]) => pid);

  if (sortedIds.length === 0) {
    const { data } = await supabase
      .from("products")
      .select("*")
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(limit);
    return await enrichProductsWithTranslationsAndRatings((data || []) as Product[]);
  }

  const { data: products } = await supabase
    .from("products")
    .select("*")
    .in("id", sortedIds)
    .eq("is_active", true);

  // Preserve order from sortedIds
  const productMap = new Map((products || []).map((p: any) => [p.id, p]));
  const ordered = sortedIds
    .map(id => productMap.get(id))
    .filter(Boolean) as Product[];

  return await enrichProductsWithTranslationsAndRatings(ordered);
}

async function enrichProductsWithRatings(products: Product[]): Promise<Product[]> {
  if (!products.length) return [];
  const productIds = products.map((p) => p.id);
  const supabase = await getSupabaseServerClient();
  const { data: reviews } = await supabase
    .from("reviews")
    .select("product_id, rating")
    .in("product_id", productIds);

  const reviewsMap = new Map<number, number[]>();
  (reviews || []).forEach((r) => {
    const pid = (r as { product_id: number; rating: number }).product_id;
    const rating = (r as { product_id: number; rating: number }).rating;
    const list = reviewsMap.get(pid) || [];
    list.push(rating);
    reviewsMap.set(pid, list);
  });

  return products.map((p) => {
    const ratings = reviewsMap.get(p.id) || [];
    const count = ratings.length;
    const sum = ratings.reduce((a, b) => a + b, 0);
    const avg = count > 0 ? sum / count : 0;
    return { ...p, rating_average: avg, review_count: count };
  });
}

async function enrichProductsWithTranslationsAndRatings(products: Product[]): Promise<Product[]> {
  if (!products.length) return [];
  const productIds = products.map((p) => p.id);
  const supabase = await getSupabaseServerClient();

  // Fetch translations and reviews in parallel
  const [{ data: translations }, { data: reviews }] = await Promise.all([
    supabase
      .from("translations")
      .select("entity_id, language, field, value")
      .eq("entity_table", "products")
      .in("entity_id", productIds),
    supabase
      .from("reviews")
      .select("product_id, rating")
      .in("product_id", productIds),
  ]);

  // Build translations map
  const translationsMap = new Map<number, Array<{ language: string; field: string; value: string }>>();
  (translations || []).forEach((t: any) => {
    const list = translationsMap.get(t.entity_id) || [];
    list.push({ language: t.language, field: t.field, value: t.value });
    translationsMap.set(t.entity_id, list);
  });

  // Build reviews map
  const reviewsMap = new Map<number, number[]>();
  (reviews || []).forEach((r: any) => {
    const list = reviewsMap.get(r.product_id) || [];
    list.push(r.rating);
    reviewsMap.set(r.product_id, list);
  });

  return products.map((p) => {
    const ratings = reviewsMap.get(p.id) || [];
    const count = ratings.length;
    const sum = ratings.reduce((a, b) => a + b, 0);
    const avg = count > 0 ? sum / count : 0;
    const productTranslations = translationsMap.get(p.id) || [];
    return {
      ...p,
      translations: productTranslations as any,
      rating_average: avg,
      review_count: count,
    };
  });
}
