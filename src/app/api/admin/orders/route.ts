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
  product_name: string | null;
  quantity: number | null;
  unit_price: number | null;
  total: number | null;
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
      .select("order_id, product_name, quantity, unit_price, total")
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

  const profileById = new Map<string, ProfileRow>(profiles.map((p) => [p.id, p]));
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
      items: orderItems.map((item) => ({
        product_name: item.product_name ?? "Məhsul",
        quantity: Number(item.quantity ?? 0),
        unit_price: Number(item.unit_price ?? 0),
        total: Number(item.total ?? 0),
      })),
    };
  });

  return NextResponse.json(response);
}
