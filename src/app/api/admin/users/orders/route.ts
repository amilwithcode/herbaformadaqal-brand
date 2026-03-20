import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient, getSupabaseAdminClient } from "@/lib/supabase-server";
import { verifyAdmin } from "@/lib/auth-utils";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");

  if (!userId) {
    return NextResponse.json({ error: "Missing userId" }, { status: 400 });
  }

  const supabase = await getSupabaseServerClient();

  // Admin yoxlaması
  const authCheck = await verifyAdmin(supabase);
  if (authCheck.error) {
    return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
  }

  // RLS-i bypass etmək üçün Admin client istifadə edirik
  const adminClient = getSupabaseAdminClient();

  const { data: orders, error } = await adminClient
    .from("orders")
    .select(`
      id,
      created_at,
      total,
      status,
      points_earned,
      order_items (
        id,
        quantity,
        unit_price,
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
  type OrderItemRow = {
    id: number;
    quantity: number | null;
    unit_price: number | null;
    product?: ProductRow | null;
  };
  type OrderRow = { [key: string]: unknown; total?: number | null; order_items?: OrderItemRow[] | null };

  const formattedOrders = ((orders as OrderRow[]) ?? []).map((order) => ({
    ...order,
    total_amount: Number(order.total ?? 0),
    order_items: (order.order_items ?? []).map((item) => {
      const translations = item.product?.translations || [];
      const nameAz = translations.find((t) => t.field === "name" && t.language === "az")?.value;
      const nameAny = translations.find((t) => t.field === "name")?.value;
      
      const productName = nameAz || nameAny || item.product?.slug || "Unknown Product";
      
      return {
        id: item.id,
        quantity: Number(item.quantity ?? 0),
        price: Number(item.unit_price ?? 0),
        productName,
        productPoints: item.product?.points || 0
      };
    })
  }));

  return NextResponse.json(formattedOrders);
}
