import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase-server";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const supabase = await getSupabaseServerClient();
  const locale = req.nextUrl.searchParams.get("locale") || "az";
  const { slug } = await params;

  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { data: textRow } = await supabase
    .from("product_texts")
    .select("*")
    .eq("product_id", data.id)
    .eq("locale", locale)
    .maybeSingle();

  const base = Number(data.base_price) || 0;
  const discount = Number(data.discount_percent) || 0;
  const finalPrice = base * (1 - discount / 100);
  const fallbackTitle =
    data.slug?.charAt(0).toUpperCase() +
      String(data.slug).slice(1).replace(/-/g, " ") || "Product";

  return NextResponse.json(
    {
      id: data.id,
      slug: data.slug,
      price: finalPrice,
      originalPrice: discount ? base : null,
      title:
        (textRow &&
          typeof textRow.title === "string" &&
          textRow.title.trim().length > 0 &&
          textRow.title) ||
        fallbackTitle,
      description:
        (textRow &&
          typeof textRow.description === "string" &&
          textRow.description) ||
        "",
    },
    { status: 200 }
  );
}
