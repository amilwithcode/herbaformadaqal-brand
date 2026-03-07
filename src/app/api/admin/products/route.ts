import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase-server";
import { verifyAdmin } from "@/lib/auth-utils";

export async function GET() {
  const supabase = await getSupabaseServerClient();
  
  // 1. Fetch products (without joins to avoid relationship errors)
  const { data: products, error: productsError } = await supabase
    .from("products")
    .select("*")
    .order("id");

  if (productsError) {
    console.error("Fetch products error:", productsError);
    return NextResponse.json({ error: productsError.message }, { status: 500 });
  }

  const productIds = (products || []).map(p => p.id);
  let images: any[] = [];
  let translations: any[] = [];
  let productCategories: any[] = [];
  
  if (productIds.length > 0) {
    // 2. Fetch images separately
    const { data: imgs, error: imgError } = await supabase
      .from("product_images")
      .select("*")
      .in("product_id", productIds)
      .order("position");
      
    if (imgError) {
      console.error("Fetch images error:", imgError);
      // We don't fail, just show no images
    } else {
      images = imgs || [];
    }

    // 3. Fetch translations separately
    const { data: trans, error: transError } = await supabase
      .from("translations")
      .select("*")
      .eq("entity_table", "products")
      .in("entity_id", productIds);

    if (transError) {
      console.error("Translations fetch error:", transError);
    } else {
      translations = trans || [];
    }

    // 4. Fetch product categories
    const { data: pc, error: pcError } = await supabase
      .from("product_categories")
      .select("product_id, category_id")
      .in("product_id", productIds);

    if (pcError) {
      console.error("Product categories fetch error:", pcError);
    } else {
      productCategories = pc || [];
    }
  }

  // 5. Merge data
  const result = (products || []).map(p => {
    const categoryIds = productCategories
      .filter(pc => pc.product_id === p.id)
      .map(pc => pc.category_id);
    
    return {
      ...p,
      product_images: images.filter(img => img.product_id === p.id),
      translations: translations.filter(t => t.entity_id === p.id),
      categoryIds: categoryIds.length > 0 ? categoryIds : (p.category_id ? [p.category_id] : [])
    };
  });

  return NextResponse.json(result, { status: 200 });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const supabase = await getSupabaseServerClient();

  // Explicit admin check
  const authCheck = await verifyAdmin(supabase);
  if (authCheck.error) {
    return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
  }

  // Admin formundan gələn qiymətləri düzgün xəritələyək:
  // - originalPrice: endirimdən əvvəlki əsas qiymət
  // - price: endirimdən sonrakı real satış qiyməti
  // DB-də isə base_price + discount_percent saxlanılır
  const originalPriceInput = Number(body.originalPrice);
  const currentPriceInput = Number(body.price);

  const basePrice =
    !Number.isNaN(originalPriceInput) && originalPriceInput > 0
      ? originalPriceInput
      : !Number.isNaN(currentPriceInput) && currentPriceInput > 0
      ? currentPriceInput
      : 0;

  const finalPrice =
    !Number.isNaN(currentPriceInput) && currentPriceInput > 0
      ? currentPriceInput
      : basePrice;
  
  // Calculate discount safely to avoid numeric overflow
  // Postgres numeric(5,2) max value is 999.99
  let discountPercent = 0;
  if (basePrice > finalPrice && basePrice > 0) {
    discountPercent = ((basePrice - finalPrice) / basePrice) * 100;
  }
  
  // Clamp discount percent to valid range for numeric(5,2)
  if (discountPercent > 999.99) discountPercent = 999.99;
  if (discountPercent < -999.99) discountPercent = -999.99;

  // Adminin yazdığı slug-u istifadə et, yoxdursa name-dən generasiya et
  let slug = "";
  if (typeof body.slug === "string" && body.slug.trim()) {
    slug = body.slug.trim();
  } else {
    const slugSource =
      typeof body.name === "string" && body.name.trim()
        ? body.name.trim()
        : "product";
    slug = slugSource
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");
  }

  // Slug-un unikal olmasını yoxla (yalnız yeni məhsul üçün)
  if (slug) {
    const { data: existing } = await supabase
      .from("products")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();
    
    if (existing) {
      // Əgər slug artıq istifadə olunursa, xəta ver
      return NextResponse.json(
        { error: "Bu slug artıq istifadə olunur. Zəhmət olmasa başqa slug seçin." },
        { status: 400 }
      );
    }
  }

  const insertPayload = {
    slug,
    base_price: basePrice,
    discount_percent: discountPercent,
    stock: Number(body.stock) || 0,
    points: Number(body.points) || 0,
    is_active: true,
    weight_goal_tag: "neutral" as const,
    image_url: body.imageUrl || null,
    usage_count: typeof body.usageCount === "string" ? body.usageCount.trim() : "",
    badge_color: typeof body.badgeColor === "string" && body.badgeColor.startsWith("#") ? body.badgeColor : "#16a34a",
    category_id:
      Array.isArray(body.categoryIds) && body.categoryIds.length > 0
        ? Number(body.categoryIds[0])
        : null,
  };

  const { data, error } = await supabase
    .from("products")
    .insert(insertPayload)
    .select("*")
    .single();

  if (error || !data) {
    console.error("Product create error:", error);
    return NextResponse.json(
      { error: error?.message || "Product create failed" },
      { status: 500 }
    );
  }

  // Save multiple categories to product_categories table
  if (Array.isArray(body.categoryIds) && body.categoryIds.length > 0 && data.id) {
    const categoryInserts = body.categoryIds.map((catId: number) => ({
      product_id: data.id,
      category_id: Number(catId),
    }));

    const { error: pcError } = await supabase
      .from("product_categories")
      .insert(categoryInserts);

    if (pcError) {
      console.error("Product categories insert error:", pcError);
      // Don't fail the request, but log the error
    }
  }

  // Insert gallery images
  if (Array.isArray(body.galleryImages) && body.galleryImages.length > 0) {
    const galleryRows = body.galleryImages.map((url: string, index: number) => ({
      product_id: data.id,
      url,
      position: index,
    }));
    
    const { error: galleryError } = await supabase
      .from("product_images")
      .insert(galleryRows);

    if (galleryError) {
      console.error("Gallery upload error:", galleryError);
      // We don't fail the whole request if gallery fails, but we log it
    }
  }

  const translations = body.translations;

  if (translations && typeof translations === "object") {
    type TranslationRow = {
      entity_table: string;
      entity_id: number;
      field: "title" | "description";
      language: string;
      value: string;
    };
    const rows: TranslationRow[] = [];
    Object.entries(translations).forEach(([locale, value]) => {
      const v = value as { title?: string; description?: string };
      if (v.title) {
        rows.push({
          entity_table: "products",
          entity_id: data.id,
          field: "title",
          language: locale,
          value: v.title,
        });
      }
      if (v.description) {
        rows.push({
          entity_table: "products",
          entity_id: data.id,
          field: "description",
          language: locale,
          value: v.description,
        });
      }
    });

    if (rows.length > 0) {
      const { error: textsError } = await supabase
        .from("translations")
        .insert(rows);
      if (textsError) {
        console.error("Translations create error:", textsError);
        return NextResponse.json(
          { error: textsError.message || "Product translations create failed" },
          { status: 500 }
        );
      }
    }
  }

  return NextResponse.json(data, { status: 201 });
}

export async function PUT(req: NextRequest) {
  const body = await req.json();
  const supabase = await getSupabaseServerClient();

  // Explicit admin check
  const authCheck = await verifyAdmin(supabase);
  if (authCheck.error) {
    return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
  }

  if (!body.id) {
    return NextResponse.json({ error: "Product ID is required" }, { status: 400 });
  }

  // Eyni məntiqi update zamanı da tətbiq edirik
  const originalPriceInput = Number(body.originalPrice);
  const currentPriceInput = Number(body.price);

  const basePrice =
    !Number.isNaN(originalPriceInput) && originalPriceInput > 0
      ? originalPriceInput
      : !Number.isNaN(currentPriceInput) && currentPriceInput > 0
      ? currentPriceInput
      : 0;

  const finalPrice =
    !Number.isNaN(currentPriceInput) && currentPriceInput > 0
      ? currentPriceInput
      : basePrice;

  let discountPercent = 0;
  if (basePrice > finalPrice && basePrice > 0) {
    discountPercent = ((basePrice - finalPrice) / basePrice) * 100;
  }

  if (discountPercent > 999.99) discountPercent = 999.99;
  if (discountPercent < -999.99) discountPercent = -999.99;

  // Adminin yazdığı slug-u istifadə et
  let slug = "";
  if (typeof body.slug === "string" && body.slug.trim()) {
    slug = body.slug.trim();
  } else {
    // Əgər slug göndərilməyibsə, mövcud slug-u saxla
    const { data: currentProduct } = await supabase
      .from("products")
      .select("slug")
      .eq("id", body.id)
      .maybeSingle();
    slug = currentProduct?.slug || "";
  }

  // Slug-un unikal olmasını yoxla (yalnız başqa məhsullar üçün)
  if (slug) {
    const { data: existing } = await supabase
      .from("products")
      .select("id")
      .eq("slug", slug)
      .neq("id", body.id) // Özü istisna olmaqla
      .maybeSingle();
    
    if (existing) {
      return NextResponse.json(
        { error: "Bu slug artıq istifadə olunur. Zəhmət olmasa başqa slug seçin." },
        { status: 400 }
      );
    }
  }

  const updatePayload: any = {
    base_price: basePrice,
    discount_percent: discountPercent,
    stock: Number(body.stock) || 0,
    points: Number(body.points) || 0,
    usage_count: typeof body.usageCount === "string" ? body.usageCount.trim() : "",
    badge_color: typeof body.badgeColor === "string" && body.badgeColor.startsWith("#") ? body.badgeColor : "#16a34a",
    category_id:
      Array.isArray(body.categoryIds) && body.categoryIds.length > 0
        ? Number(body.categoryIds[0])
        : null,
    updated_at: new Date().toISOString(),
  };

  // Slug-u update et
  if (slug) {
    updatePayload.slug = slug;
  }
  
  if (body.imageUrl) {
    updatePayload.image_url = body.imageUrl;
  }

  const { data, error } = await supabase
    .from("products")
    .update(updatePayload)
    .eq("id", body.id)
    .select("*")
    .single();

  if (error || !data) {
    console.error("Product update error:", error);
    return NextResponse.json(
      { error: error?.message || "Product update failed" },
      { status: 500 }
    );
  }

  // Update product categories
  // Strategy: Delete all existing categories for this product and re-insert new ones
  if (Array.isArray(body.categoryIds)) {
    // 1. Delete existing categories
    await supabase.from("product_categories").delete().eq("product_id", body.id);

    // 2. Insert new categories
    if (body.categoryIds.length > 0) {
      const categoryInserts = body.categoryIds.map((catId: number) => ({
        product_id: body.id,
        category_id: Number(catId),
      }));

      const { error: pcError } = await supabase
        .from("product_categories")
        .insert(categoryInserts);

      if (pcError) {
        console.error("Product categories update error:", pcError);
        // Don't fail the request, but log the error
      }
    }
  }

  // Update gallery images
  // Strategy: Delete all existing images for this product and re-insert new ones
  // This is simpler than diffing.
  if (Array.isArray(body.galleryImages)) {
    // 1. Delete existing
    await supabase.from("product_images").delete().eq("product_id", body.id);

    // 2. Insert new
    if (body.galleryImages.length > 0) {
      const galleryRows = body.galleryImages.map((url: string, index: number) => ({
        product_id: body.id,
        url,
        position: index,
      }));
      
      const { error: galleryError } = await supabase
        .from("product_images")
        .insert(galleryRows);

      if (galleryError) {
        console.error("Gallery update error:", galleryError);
      }
    }
  }

  // Update translations
  // Strategy: Delete all existing translations for this product and re-insert new ones
  const translations = body.translations;

  if (translations && typeof translations === "object") {
    // 1. Delete existing
    await supabase
      .from("translations")
      .delete()
      .eq("entity_table", "products")
      .eq("entity_id", body.id);

    // 2. Insert new
    type TranslationRow = {
      entity_table: string;
      entity_id: number;
      field: "title" | "description";
      language: string;
      value: string;
    };
    const rows: TranslationRow[] = [];
    Object.entries(translations).forEach(([locale, value]) => {
      const v = value as { title?: string; description?: string };
      if (v.title) {
        rows.push({
          entity_table: "products",
          entity_id: body.id,
          field: "title",
          language: locale,
          value: v.title,
        });
      }
      if (v.description) {
        rows.push({
          entity_table: "products",
          entity_id: body.id,
          field: "description",
          language: locale,
          value: v.description,
        });
      }
    });

    if (rows.length > 0) {
      const { error: textsError } = await supabase
        .from("translations")
        .insert(rows);
      if (textsError) {
        console.error("Translations update error:", textsError);
        return NextResponse.json(
          { error: textsError.message || "Product translations update failed" },
          { status: 500 }
        );
      }
    }
  }

  return NextResponse.json(data, { status: 200 });
}

export async function DELETE(req: NextRequest) {
  const body = await req.json();
  const supabase = await getSupabaseServerClient();
  
  // Explicit admin check
  const authCheck = await verifyAdmin(supabase);
  if (authCheck.error) {
    return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
  }

  const id = body.id;
  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  // Delete product (cascade deletes images and translations)
  const { error } = await supabase.from("products").delete().eq("id", id);
  
  if (error) {
    return NextResponse.json(
      { error: error.message || "Product delete failed" },
      { status: 500 }
    );
  }
  
  return NextResponse.json({ success: true }, { status: 200 });
}
