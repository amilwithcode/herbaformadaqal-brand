import { NextResponse } from "next/server";

/**
 * OAuth Protected Resource Metadata (.well-known/oauth-protected-resource)
 */
export async function GET() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.herbaformadaqal.com";
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://lhsmlimcxnuzlnpdbnbq.supabase.co";

  const metadata = {
    resource: `${siteUrl}/api`,
    authorization_servers: [`${supabaseUrl}/auth/v1`],
    scopes_supported: ["read", "write", "admin"],
    bearer_methods_supported: ["header"],
    resource_documentation: "https://github.com/your-repo/docs",
  };

  return NextResponse.json(metadata, {
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=86400",
    },
  });
}
