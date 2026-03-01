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
  }

  // 4. Merge data
  const result = (products || []).map(p => ({
    ...p,
    product_images: images.filter(img => img.product_id === p.id),
    translations: translations.filter(t => t.entity_id === p.id)
  }));

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

  const basePrice = Number(body.price) || 0;
  const originalPrice = Number(body.originalPrice) || basePrice;
  
  // Calculate discount safely to avoid numeric overflow
  // Postgres numeric(5,2) max value is 999.99
  let discountPercent = 0;
  if (originalPrice > basePrice && originalPrice > 0) {
    discountPercent = ((originalPrice - basePrice) / originalPrice) * 100;
  }
  
  // Clamp discount percent to valid range for numeric(5,2)
  if (discountPercent > 999.99) discountPercent = 999.99;
  if (discountPercent < -999.99) discountPercent = -999.99;

  const slugSource =
    typeof body.name === "string" && body.name.trim()
      ? body.name.trim()
      : "product";

  // Append a timestamp to ensure uniqueness
  const slug = `${slugSource.toLowerCase().replace(/\s+/g, "-")}-${Date.now()}`;

  const insertPayload = {
    slug,
    base_price: basePrice,
    discount_percent: discountPercent,
    stock: Number(body.stock) || 0,
    points: Number(body.points) || 0,
    is_active: true,
    weight_goal_tag: "neutral" as const,
    image_url: body.imageUrl || null,
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

  const basePrice = Number(body.price) || 0;
  const originalPrice = Number(body.originalPrice) || basePrice;
  
  let discountPercent = 0;
  if (originalPrice > basePrice && originalPrice > 0) {
    discountPercent = ((originalPrice - basePrice) / originalPrice) * 100;
  }
  
  if (discountPercent > 999.99) discountPercent = 999.99;
  if (discountPercent < -999.99) discountPercent = -999.99;

  const updatePayload: any = {
    base_price: basePrice,
    discount_percent: discountPercent,
    stock: Number(body.stock) || 0,
    points: Number(body.points) || 0,
    category_id:
      Array.isArray(body.categoryIds) && body.categoryIds.length > 0
        ? Number(body.categoryIds[0])
        : null,
    updated_at: new Date().toISOString(),
  };

  // Only update slug if name is explicitly changed? 
  // For simplicity, let's keep slug stable or update only if needed.
  // Actually, usually slug should be stable. Let's not update slug automatically to avoid breaking SEO.
  // But we can update it if we want. Let's stick to stable slug for now unless we add a specific field for it.
  
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
