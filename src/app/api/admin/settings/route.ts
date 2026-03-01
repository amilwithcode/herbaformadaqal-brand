import { NextRequest, NextResponse } from "next/server";
import {
  SUPABASE_CONFIGURED,
  getSupabaseServerClient,
} from "@/lib/supabase-server";
import { verifyAdmin } from "@/lib/auth-utils";

export const dynamic = "force-dynamic";

const TABLE = "site_settings";

export async function GET() {
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .eq("id", 1)
    .maybeSingle();
    
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  
  if (!data) {
    return NextResponse.json({}, { status: 200 });
  }
  
  return NextResponse.json(data, { status: 200 });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  
  // Əsas ayarlar payload-u (hide_prices/hide_points BURDA OLMAMALIDIR — ayrıca handle olunur)
  const payload: Record<string, unknown> = {
    id: 1, 
    logo: body.logoName ?? "",
    site_name: body.siteName ?? "",
    primary_color: body.primaryColor ?? "",
    rules: body.rules ?? "",
    public_site_name: body.publicSiteName ?? "",
    footer_brand_name: body.footerBrandName ?? body.publicSiteName ?? "",
    footer_phone: body.footerPhone ?? "",
    footer_email: body.footerEmail ?? "",
    footer_address: body.footerAddress ?? "",
    faq_content: body.faqContent ?? "",
    shipping_content: body.shippingContent ?? "",
    returns_content: body.returnsContent ?? "",
    privacy_content: body.privacyContent ?? "",
    about_content: body.aboutContent ?? "",
    social_facebook: body.socialFacebook ?? "",
    social_instagram: body.socialInstagram ?? "",
    social_twitter: body.socialTwitter ?? "",
    social_youtube: body.socialYoutube ?? "",
    social_tiktok: body.socialTiktok ?? "",
    social_linkedin: body.socialLinkedin ?? "",
    social_telegram: body.socialTelegram ?? "",
    social_whatsapp: body.socialWhatsapp ?? "",
    updated_at: new Date().toISOString()
  };

  // Yalnız açıq-aşkar göndərildikdə hide_prices/hide_points əlavə et
  if (body.hidePrices !== undefined) {
    payload.hide_prices = !!body.hidePrices;
  }
  if (body.hidePoints !== undefined) {
    payload.hide_points = !!body.hidePoints;
  }

  if (!SUPABASE_CONFIGURED) {
    return NextResponse.json(payload, { status: 200 });
  }

  const supabase = await getSupabaseServerClient();

  // Explicit admin check
  const authCheck = await verifyAdmin(supabase);
  if (authCheck.error) {
    return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
  }
  
  // Upsert with onConflict on 'id'
  const { data, error } = await supabase
    .from(TABLE)
    .upsert(payload, { onConflict: "id" })
    .select("*")
    .single();

  if (error) {
    // Əgər hide_prices/hide_points sütunları yoxdursa, onları çıxarıb yenidən cəhd et
    if (error.message && (error.message.includes("hide_prices") || error.message.includes("hide_points"))) {
      delete payload.hide_prices;
      delete payload.hide_points;
      const { data: retryData, error: retryError } = await supabase
        .from(TABLE)
        .upsert(payload, { onConflict: "id" })
        .select("*")
        .single();
      
      if (retryError) {
        return NextResponse.json(
          { error: retryError.message || "Settings create failed" },
          { status: 500 }
        );
      }
      return NextResponse.json({ ...retryData, _visibility_columns_missing: true }, { status: 201 });
    }

    return NextResponse.json(
      { error: error.message || "Settings create failed" },
      { status: 500 }
    );
  }

  return NextResponse.json(data, { status: 201 });
}

// PUT is essentially the same as POST for this singleton pattern
export async function PUT(req: NextRequest) {
  return POST(req);
}

export async function DELETE() {
  if (!SUPABASE_CONFIGURED) {
    return NextResponse.json({ success: true }, { status: 200 });
  }
  const supabase = await getSupabaseServerClient();

  // Explicit admin check
  const authCheck = await verifyAdmin(supabase);
  if (authCheck.error) {
    return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
  }

  const { error } = await supabase.from(TABLE).delete().eq("id", 1);
  
  if (error) {
    return NextResponse.json(
      { error: error.message || "Settings delete failed" },
      { status: 500 }
    );
  }
  return NextResponse.json({ success: true }, { status: 200 });
}
