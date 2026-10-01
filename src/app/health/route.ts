import { NextResponse } from "next/server";
import { SUPABASE_CONFIGURED } from "@/lib/supabase-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const health = {
    status: SUPABASE_CONFIGURED ? "ok" : "degraded",
    service: "herba-formada-qal",
    time: new Date().toISOString(),
    checks: {
      env: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) && Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
      supabase: SUPABASE_CONFIGURED,
    },
  };
  const statusCode = health.status === "ok" ? 200 : 503;
  return NextResponse.json(health, {
    status: statusCode,
    headers: {
      "Cache-Control": "no-store, max-age=0, must-revalidate",
      "Content-Security-Policy": "default-src 'none'; frame-ancestors 'none'",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
