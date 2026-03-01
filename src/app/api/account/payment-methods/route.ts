import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase-server";

type PaymentMethod = {
  id: string;
  brand: string;
  last4: string;
  expiryMonth: string;
  expiryYear: string;
  isDefault?: boolean;
};

function sanitizeMethods(value: unknown): PaymentMethod[] {
  if (!Array.isArray(value)) return [];
  const items: PaymentMethod[] = [];
  for (const item of value) {
    if (!item || typeof item !== "object") continue;
    const raw = item as Record<string, unknown>;
    const idRaw = raw.id;
    const brandRaw = raw.brand;
    const last4Raw = raw.last4;
    const monthRaw = raw.expiryMonth;
    const yearRaw = raw.expiryYear;
    const id =
      typeof idRaw === "string" && idRaw.trim()
        ? idRaw.trim().slice(0, 64)
        : "";
    const brand =
      typeof brandRaw === "string" && brandRaw.trim()
        ? brandRaw.trim().slice(0, 30)
        : "";
    const last4 =
      typeof last4Raw === "string" && last4Raw.trim()
        ? last4Raw.replace(/\D/g, "").slice(-4)
        : "";
    const expiryMonth =
      typeof monthRaw === "string" && monthRaw.trim()
        ? monthRaw.trim().slice(0, 2)
        : "";
    const expiryYear =
      typeof yearRaw === "string" && yearRaw.trim()
        ? yearRaw.trim().slice(0, 4)
        : "";
    if (!id || !last4 || !expiryMonth || !expiryYear) continue;
    const isDefault = Boolean(raw.isDefault);
    items.push({
      id,
      brand,
      last4,
      expiryMonth,
      expiryYear,
      isDefault,
    });
  }
  return items;
}

function generateId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2);
}

export async function GET() {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const meta =
    (user as { user_metadata?: Record<string, unknown> }).user_metadata || {};
  const raw = meta.payment_methods;
  const items = sanitizeMethods(raw);

  return NextResponse.json({ items }, { status: 200 });
}

export async function POST(req: NextRequest) {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();

  const brandRaw = typeof body.brand === "string" ? body.brand : "";
  const last4Raw = typeof body.last4 === "string" ? body.last4 : "";
  const monthRaw =
    typeof body.expiryMonth === "string" ? body.expiryMonth : "";
  const yearRaw = typeof body.expiryYear === "string" ? body.expiryYear : "";
  const isDefault = Boolean(body.isDefault);

  const brand = brandRaw.trim().slice(0, 30);
  const last4 = last4Raw.replace(/\D/g, "").slice(-4);
  const expiryMonth = monthRaw.trim().slice(0, 2);
  const expiryYear = yearRaw.trim().slice(0, 4);

  if (!last4 || last4.length !== 4) {
    return NextResponse.json(
      { error: "Son 4 rəqəm düzgün deyil" },
      { status: 400 }
    );
  }
  if (!expiryMonth || !expiryYear) {
    return NextResponse.json(
      { error: "Bitmə tarixi düzgün deyil" },
      { status: 400 }
    );
  }

  const meta =
    (user as { user_metadata?: Record<string, unknown> }).user_metadata || {};
  const existing = sanitizeMethods(meta.payment_methods);

  const id = generateId();

  const next: PaymentMethod[] = existing.map((m) => ({
    ...m,
    isDefault: isDefault ? false : m.isDefault,
  }));

  next.push({
    id,
    brand,
    last4,
    expiryMonth,
    expiryYear,
    isDefault: isDefault || existing.length === 0,
  });

  const { error } = await supabase.auth.updateUser({
    data: {
      payment_methods: next,
    },
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ items: next }, { status: 200 });
}

export async function PUT(req: NextRequest) {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const idRaw = body.id;
  const id =
    typeof idRaw === "string" && idRaw.trim() ? idRaw.trim().slice(0, 64) : "";

  if (!id) {
    return NextResponse.json({ error: "Kart tapılmadı" }, { status: 400 });
  }

  const meta =
    (user as { user_metadata?: Record<string, unknown> }).user_metadata || {};
  const existing = sanitizeMethods(meta.payment_methods);

  const index = existing.findIndex((m) => m.id === id);
  if (index === -1) {
    return NextResponse.json({ error: "Kart tapılmadı" }, { status: 404 });
  }

  const brandRaw = typeof body.brand === "string" ? body.brand : "";
  const last4Raw = typeof body.last4 === "string" ? body.last4 : "";
  const monthRaw =
    typeof body.expiryMonth === "string" ? body.expiryMonth : "";
  const yearRaw = typeof body.expiryYear === "string" ? body.expiryYear : "";
  const isDefault =
    typeof body.isDefault === "boolean" ? body.isDefault : existing[index].isDefault;

  const brand = brandRaw.trim().slice(0, 30);
  const last4 = last4Raw ? last4Raw.replace(/\D/g, "").slice(-4) : existing[index].last4;
  const expiryMonth = monthRaw.trim() || existing[index].expiryMonth;
  const expiryYear = yearRaw.trim() || existing[index].expiryYear;

  if (!last4 || last4.length !== 4) {
    return NextResponse.json(
      { error: "Son 4 rəqəm düzgün deyil" },
      { status: 400 }
    );
  }
  if (!expiryMonth || !expiryYear) {
    return NextResponse.json(
      { error: "Bitmə tarixi düzgün deyil" },
      { status: 400 }
    );
  }

  const next: PaymentMethod[] = existing.map((m) => ({ ...m }));

  next[index] = {
    ...next[index],
    brand: brand || next[index].brand,
    last4,
    expiryMonth,
    expiryYear,
  };

  if (isDefault) {
    for (const m of next) {
      m.isDefault = m.id === id;
    }
  }

  const { error } = await supabase.auth.updateUser({
    data: {
      payment_methods: next,
    },
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ items: next }, { status: 200 });
}

