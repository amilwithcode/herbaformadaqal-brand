import { NextResponse } from "next/server";

/**
 * OpenID Connect Discovery (.well-known/openid-configuration)
 */
export async function GET() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.herbaformadaqal.com";
  // Supabase URL adətən auth provayderidir
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://lhsmlimcxnuzlnpdbnbq.supabase.co";

  const config = {
    issuer: `${supabaseUrl}/auth/v1`,
    authorization_endpoint: `${supabaseUrl}/auth/v1/authorize`,
    token_endpoint: `${supabaseUrl}/auth/v1/token`,
    jwks_uri: `${supabaseUrl}/auth/v1/keys`,
    response_types_supported: ["code", "token", "id_token"],
    subject_types_supported: ["public"],
    id_token_signing_alg_values_supported: ["RS256"],
  };

  return NextResponse.json(config, {
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=86400",
    },
  });
}
