import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase-server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");

  if (!userId) {
    return NextResponse.json({ error: "Missing userId" }, { status: 400 });
  }

  const supabase = await getSupabaseServerClient();

  // We fetch orders and join order_items -> products -> translations
  // Note: translations join might be tricky if not set up correctly, 
  // so we'll just get slug and points for now to be safe, or try to get name.
  
  const { data: orders, error } = await supabase
    .from("orders")
    .select(`
      id,
      created_at,
      total_amount,
      status,
      points_earned,
      order_items (
        id,
        quantity,
        price,
        product:products (
          slug,
          points,
          translations (
             field,
             value,
             language
          )
        )
      )
    `)
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching user orders:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Process translations for product name
  type ProductTranslation = { field?: string; language?: string; value?: string };
  type ProductRow = { slug?: string; points?: number; translations?: ProductTranslation[] };
  type OrderItemRow = { id: number; quantity: number; price: number; product?: ProductRow };
  type OrderRow = { [key: string]: unknown; order_items: OrderItemRow[] };
  const formattedOrders = (orders as OrderRow[]).map((order) => ({
    ...order,
    order_items: order.order_items.map((item) => {
      // Find 'name' in translations if available, fallback to slug.
      // Prioritize 'az' language.
      const translations = item.product?.translations || [];
      const nameAz = translations.find((t) => t.field === "name" && t.language === "az")?.value;
      const nameAny = translations.find((t) => t.field === "name")?.value;
      
      const productName = nameAz || nameAny || item.product?.slug || "Unknown Product";
      
      return {
        id: item.id,
        quantity: item.quantity,
        price: item.price,
        productName,
        productPoints: item.product?.points || 0
      };
    })
  }));

  return NextResponse.json(formattedOrders);
}
