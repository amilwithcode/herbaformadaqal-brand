import { getSupabaseServerClient } from "@/lib/supabase-server";
import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/auth-utils";

// GET – list all campaigns
export async function GET() {
  try {
    const supabase = await getSupabaseServerClient();
    const { data, error } = await supabase
      .from("campaigns")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data || []);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST – create a campaign
export async function POST(req: NextRequest) {
  try {
    const supabase = await getSupabaseServerClient();
    const authCheck = await verifyAdmin(supabase);
    if (authCheck.error) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
    }

    const body = await req.json();
    const slug = (body.slug || body.title || `campaign-${Date.now()}`)
      .toString()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

    const { data: campaign, error } = await supabase
      .from("campaigns")
      .insert({
        slug,
        campaign_type: body.campaign_type || "discount",
        starts_at: body.starts_at || null,
        ends_at: body.ends_at || null,
        is_active: body.is_active ?? true,
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (!campaign) return NextResponse.json({ error: "Campaign create failed" }, { status: 500 });

    // Məhsulları kampaniyaya əlavə et
    if (Array.isArray(body.productIds) && body.productIds.length > 0 && campaign.id) {
      const discountPercent = Number(body.discount_percent) || 0;
      const campaignProducts = body.productIds.map((productId: number) => ({
        campaign_id: campaign.id,
        product_id: productId,
        discount_percent: discountPercent,
      }));

      const { error: cpError } = await supabase
        .from("campaign_products")
        .insert(campaignProducts);

      if (cpError) {
        console.error("Campaign products insert error:", cpError);
        // Kampaniyanı sil və xəta qaytar
        await supabase.from("campaigns").delete().eq("id", campaign.id);
        return NextResponse.json({ error: "Məhsullar əlavə edilmədi: " + cpError.message }, { status: 500 });
      }
    }

    return NextResponse.json(campaign, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// PUT – update a campaign
export async function PUT(req: NextRequest) {
  try {
    const supabase = await getSupabaseServerClient();
    const authCheck = await verifyAdmin(supabase);
    if (authCheck.error) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
    }

    const body = await req.json();
    if (!body.id) return NextResponse.json({ error: "id required" }, { status: 400 });

    const update: Record<string, any> = {};
    if (body.slug !== undefined) update.slug = body.slug;
    if (body.campaign_type !== undefined) update.campaign_type = body.campaign_type;
    if (body.starts_at !== undefined) update.starts_at = body.starts_at || null;
    if (body.ends_at !== undefined) update.ends_at = body.ends_at || null;
    if (body.is_active !== undefined) update.is_active = body.is_active;

    const { data, error } = await supabase
      .from("campaigns")
      .update(update)
      .eq("id", body.id)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (!data) return NextResponse.json({ error: "Campaign not found" }, { status: 404 });

    // Məhsulları yenilə
    if (Array.isArray(body.productIds)) {
      // Köhnə məhsulları sil
      await supabase.from("campaign_products").delete().eq("campaign_id", body.id);

      // Yeni məhsulları əlavə et
      if (body.productIds.length > 0) {
        const discountPercent = Number(body.discount_percent) || 0;
        const campaignProducts = body.productIds.map((productId: number) => ({
          campaign_id: body.id,
          product_id: productId,
          discount_percent: discountPercent,
        }));

        const { error: cpError } = await supabase
          .from("campaign_products")
          .insert(campaignProducts);

        if (cpError) {
          console.error("Campaign products update error:", cpError);
          return NextResponse.json({ error: "Məhsullar yenilənmədi: " + cpError.message }, { status: 500 });
        }
      }
    }

    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// DELETE – remove a campaign
export async function DELETE(req: NextRequest) {
  try {
    const supabase = await getSupabaseServerClient();
    const authCheck = await verifyAdmin(supabase);
    if (authCheck.error) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

    const { error } = await supabase.from("campaigns").delete().eq("id", Number(id));
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
