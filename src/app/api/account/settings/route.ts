import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase-server";

type AccountSettings = {
  emailOrders: boolean;
  emailPromotions: boolean;
  smsNotifications: boolean;
  whatsappNotifications: boolean;
};

function sanitizeSettings(value: unknown): AccountSettings {
  if (!value || typeof value !== "object") {
    return {
      emailOrders: true,
      emailPromotions: false,
      smsNotifications: false,
      whatsappNotifications: false,
    };
  }
  const raw = value as Record<string, unknown>;
  return {
    emailOrders: Boolean(raw.emailOrders ?? true),
    emailPromotions: Boolean(raw.emailPromotions ?? false),
    smsNotifications: Boolean(raw.smsNotifications ?? false),
    whatsappNotifications: Boolean(raw.whatsappNotifications ?? false),
  };
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
  const settings = sanitizeSettings(meta.account_settings);

  return NextResponse.json(settings, { status: 200 });
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
  const next = sanitizeSettings(body);

  const { error } = await supabase.auth.updateUser({
    data: {
      account_settings: next,
    },
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(next, { status: 200 });
}

