import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase-server";
import { verifyAdmin } from "@/lib/auth-utils";

const TABLE = "content_posts";

export async function GET() {
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .order("is_pinned", { ascending: false })
    .order("created_at", { ascending: false });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data ?? [], { status: 200 });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const supabase = await getSupabaseServerClient();

    // Admin yoxlaması
    const authCheck = await verifyAdmin(supabase);
    if (authCheck.error) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
    }

    const title = body.title || "";
    if (!title.trim()) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    // Auto-generate slug from title
    const slug =
      title
        .toLowerCase()
        .replace(/ə/g, "e")
        .replace(/ş/g, "s")
        .replace(/ö/g, "o")
        .replace(/ü/g, "u")
        .replace(/ı/g, "i")
        .replace(/ç/g, "c")
        .replace(/ğ/g, "g")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "") + "-" + Date.now();

    // Bütün mümkün sütunları əlavə et
    let payload: Record<string, unknown> = {
      title: title.trim(),
    };

    // Yalnız mövcud sütunları əlavə et - xəta baş verərsə, həmin sütunu skip et
    const optionalFields = [
      { key: "excerpt", value: body.excerpt || "" },
      { key: "body", value: body.body || "" },
      { key: "slug", value: slug },
      { key: "is_pinned", value: body.isPinned ?? false },
      { key: "image_url", value: body.imageUrl || body.image_url || "" },
      { key: "category", value: body.category || "" },
    ];

    // İlk cəhd - bütün sütunlarla
    for (const field of optionalFields) {
      payload[field.key] = field.value;
    }

    let { data, error } = await supabase
      .from(TABLE)
      .insert(payload)
      .select("*")
      .single();

    // Əgər hər hansı bir sütun yoxdursa, onu tapıb çıxar və yenidən cəhd et
    // Bu proses bir neçə dəfə təkrarlana bilər (bir neçə sütun yoxdursa)
    let maxRetries = 5;
    while (error && error.message.includes("Could not find") && maxRetries > 0) {
      const missingColumnMatch = error.message.match(/Could not find the '(\w+)' column/);
      if (missingColumnMatch) {
        const missingColumn = missingColumnMatch[1];
        console.warn(`Column '${missingColumn}' not found, retrying without it`);
        delete payload[missingColumn];
        
        const retryResult = await supabase
          .from(TABLE)
          .insert(payload)
          .select("*")
          .single();
        data = retryResult.data;
        error = retryResult.error;
        maxRetries--;
      } else {
        break;
      }
    }

    if (error) {
      console.error("Post create error:", error);
      return NextResponse.json(
        { error: error.message || "Post create failed" },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { error: "Post create failed: No data returned" },
        { status: 500 }
      );
    }

    return NextResponse.json(data, { status: 201 });
  } catch (err: any) {
    console.error("POST /api/admin/content/posts error:", err);
    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const id = body.id as string | undefined;
    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    const supabase = await getSupabaseServerClient();

    // Admin yoxlaması
    const authCheck = await verifyAdmin(supabase);
    if (authCheck.error) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
    }

    const patch: Record<string, unknown> = {};
    if (typeof body.title === "string") patch.title = body.title;
    if (typeof body.excerpt === "string") patch.excerpt = body.excerpt;
    if (typeof body.body === "string") patch.body = body.body;
    if (typeof body.category === "string") patch.category = body.category;
    if (typeof body.isPinned === "boolean") patch.is_pinned = body.isPinned;
    if (typeof body.imageUrl === "string") patch.image_url = body.imageUrl;
    if (typeof body.image_url === "string") patch.image_url = body.image_url;

    const { data, error } = await supabase
      .from(TABLE)
      .update(patch)
      .eq("id", id)
      .select("*")
      .single();

    if (error) {
      console.error("Post update error:", error);
      return NextResponse.json(
        { error: error.message || "Post update failed" },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { error: "Post update failed: No data returned" },
        { status: 500 }
      );
    }

    return NextResponse.json(data, { status: 200 });
  } catch (err: any) {
    console.error("PATCH /api/admin/content/posts error:", err);
    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json();
    const id = body.id as string | undefined;
    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    const supabase = await getSupabaseServerClient();

    // Admin yoxlaması
    const authCheck = await verifyAdmin(supabase);
    if (authCheck.error) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
    }

    const { error } = await supabase.from(TABLE).delete().eq("id", id);
    if (error) {
      console.error("Post delete error:", error);
      return NextResponse.json(
        { error: error.message || "Post delete failed" },
        { status: 500 }
      );
    }
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err: any) {
    console.error("DELETE /api/admin/content/posts error:", err);
    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}
