import { NextResponse } from "next/server";

/**
 * MCP Server Card (SEP-1649)
 * Agentlərin MCP server imkanlarını kəşf etməsi üçün.
 */
export async function GET() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.herbaformadaqal.com";

  const card = {
    serverInfo: {
      name: "Herbaformadaqal API Server",
      version: "1.0.0",
      description: "Herbalife Azərbaycan məhsul və proqram idarəetmə API-si",
    },
    transport: {
      type: "http",
      endpoint: `${siteUrl}/api/mcp`,
    },
    capabilities: {
      resources: true,
      prompts: true,
      tools: true,
    },
  };

  return NextResponse.json(card, {
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=86400",
    },
  });
}
