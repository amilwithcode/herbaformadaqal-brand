import { NextResponse } from "next/server";
import { getSupabaseAdminClient, getSupabaseServerClient } from "@/lib/supabase-server";
import { verifyAdmin } from "@/lib/auth-utils";

type OrderRow = {
  id: number;
  user_id: string | null;
  status: string | null;
  total: number | null;
  currency: string | null;
  created_at: string | null;
};

type ProfileRow = {
  id: string;
  full_name: string | null;
  phone: string | null;
};

type OrderItemRow = {
  order_id: number;
  product_id: number | null;
  quantity: number | null;
  unit_price: number | null;
  total: number | null;
};

type ProductRow = {
  id: number;
  slug: string | null;
};

export async function GET() {
  const supabase = await getSupabaseServerClient();
  const authCheck = await verifyAdmin(supabase);
  if (authCheck.error) {
    return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
  }

  const adminClient = getSupabaseAdminClient();

  const { data: orders, error: ordersError } = await adminClient
    .from("orders")
    .select("id, user_id, status, total, currency, created_at")
    .order("created_at", { ascending: false })
    .limit(100);

  if (ordersError) {
    return NextResponse.json({ error: ordersError.message }, { status: 500 });
  }

  const orderRows = (orders ?? []) as OrderRow[];
  if (!orderRows.length) {
    return NextResponse.json([]);
  }

  const userIds = Array.from(new Set(orderRows.map((o) => o.user_id).filter(Boolean))) as string[];
  const orderIds = orderRows.map((o) => o.id);

  const [profilesResult, itemsResult] = await Promise.all([
    userIds.length
      ? adminClient
          .from("profiles")
          .select("id, full_name, phone")
          .in("id", userIds)
      : Promise.resolve({ data: [], error: null }),
    adminClient
      .from("order_items")
      .select("order_id, product_id, quantity, unit_price, total")
      .in("order_id", orderIds),
  ]);

  if (profilesResult.error) {
    return NextResponse.json({ error: profilesResult.error.message }, { status: 500 });
  }
  if (itemsResult.error) {
    return NextResponse.json({ error: itemsResult.error.message }, { status: 500 });
  }

  const profiles = (profilesResult.data ?? []) as ProfileRow[];
  const items = (itemsResult.data ?? []) as OrderItemRow[];
  const productIds = Array.from(
    new Set(items.map((item) => item.product_id).filter((id): id is number => typeof id === "number"))
  );

  const [productsResult, translationsResult] = await Promise.all([
    productIds.length
      ? adminClient.from("products").select("id, slug").in("id", productIds)
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

  const profileById = new Map<string, ProfileRow>(profiles.map((p) => [p.id, p]));
  const productById = new Map<number, ProductRow>(
    ((productsResult.data ?? []) as ProductRow[]).map((p) => [p.id, p])
  );
  const productTranslations = new Map<number, Array<{ language?: string; value?: string }>>();
  ((translationsResult.data ?? []) as Array<{ entity_id: number; language?: string; value?: string }>).forEach((t) => {
    const list = productTranslations.get(t.entity_id) ?? [];
    list.push({ language: t.language, value: t.value });
    productTranslations.set(t.entity_id, list);
  });

  const itemsByOrderId = new Map<number, OrderItemRow[]>();
  for (const item of items) {
    const list = itemsByOrderId.get(item.order_id) ?? [];
    list.push(item);
    itemsByOrderId.set(item.order_id, list);
  }

  const response = orderRows.map((order) => {
    const profile = order.user_id ? profileById.get(order.user_id) : undefined;
    const orderItems = itemsByOrderId.get(order.id) ?? [];
    return {
      id: order.id,
      created_at: order.created_at,
      status: order.status ?? "pending",
      total: Number(order.total ?? 0),
      currency: order.currency ?? "AZN",
      customer: {
        id: order.user_id,
        full_name: profile?.full_name ?? null,
        phone: profile?.phone ?? null,
      },
      items: orderItems.map((item) => {
        const product = item.product_id ? productById.get(item.product_id) : undefined;
        const names = item.product_id ? productTranslations.get(item.product_id) ?? [] : [];
        const nameAz = names.find((t) => t.language === "az")?.value;
        const nameAny = names.find((t) => !!t.value)?.value;
        return {
          product_name: nameAz || nameAny || product?.slug || (item.product_id ? `Məhsul #${item.product_id}` : "Məhsul"),
          quantity: Number(item.quantity ?? 0),
          unit_price: Number(item.unit_price ?? 0),
          total: Number(item.total ?? 0),
        };
      }),
    };
  });

  return NextResponse.json(response);
}
