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
        product_id,
        quantity,
        unit_price
      )
    `)
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching user orders:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Process translations for product name
  type OrderItemRow = {
    id: number;
    product_id?: number | null;
    quantity: number | null;
    unit_price: number | null;
  };
  type OrderRow = { [key: string]: unknown; total?: number | null; order_items?: OrderItemRow[] | null };

  const orderRows = (orders as OrderRow[]) ?? [];
  const productIds = Array.from(
    new Set(
      orderRows
        .flatMap((order) => order.order_items ?? [])
        .map((item) => item.product_id)
        .filter((id): id is number => typeof id === "number")
    )
  );

  const [productsResult, translationsResult] = await Promise.all([
    productIds.length
      ? adminClient.from("products").select("id, slug, points").in("id", productIds)
      : Promise.resolve({ data: [], error: null }),
    productIds.length
      ? adminClient
          .from("translations")
          .select("entity_id, language, field, value")
          .eq("entity_table", "products")
          .eq("field", "name")
          .in("entity_id", productIds)
      : Promise.resolve({ data: [], error: null }),
  ]);

  if (productsResult.error) {
    return NextResponse.json({ error: productsResult.error.message }, { status: 500 });
  }
  if (translationsResult.error) {
    return NextResponse.json({ error: translationsResult.error.message }, { status: 500 });
  }

  const productById = new Map<number, { slug?: string | null; points?: number | null }>(
    ((productsResult.data ?? []) as Array<{ id: number; slug?: string | null; points?: number | null }>).map((p) => [
      p.id,
      { slug: p.slug, points: p.points },
    ])
  );
  const productTranslations = new Map<number, Array<{ language?: string; value?: string }>>();
  ((translationsResult.data ?? []) as Array<{ entity_id: number; language?: string; value?: string }>).forEach((t) => {
    const list = productTranslations.get(t.entity_id) ?? [];
    list.push({ language: t.language, value: t.value });
    productTranslations.set(t.entity_id, list);
  });

  const formattedOrders = orderRows.map((order) => ({
    ...order,
    total_amount: Number(order.total ?? 0),
    order_items: (order.order_items ?? []).map((item) => {
      const product = item.product_id ? productById.get(item.product_id) : undefined;
      const names = item.product_id ? productTranslations.get(item.product_id) ?? [] : [];
      const nameAz = names.find((t) => t.language === "az")?.value;
      const nameAny = names.find((t) => !!t.value)?.value;
      
      const productName =
        nameAz || nameAny || product?.slug || (item.product_id ? `Məhsul #${item.product_id}` : "Unknown Product");
      
      return {
        id: item.id,
        quantity: Number(item.quantity ?? 0),
        price: Number(item.unit_price ?? 0),
        productName,
        productPoints: Number(product?.points ?? 0),
      };
    })
  }));

  return NextResponse.json(formattedOrders);
}
