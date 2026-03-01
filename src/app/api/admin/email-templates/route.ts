import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase-server";
import { verifyAdmin } from "@/lib/auth-utils";

export const dynamic = "force-dynamic";

/**
 * Supabase Management API vasitəsilə email template-lərini idarə edir.
 * 
 * Tələb olunan env variables:
 * - NEXT_PUBLIC_SUPABASE_URL  (project ref buradan çıxarılır)
 * - SUPABASE_SERVICE_ROLE_KEY (Management API üçün)
 */

function getProjectRef(): string | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) return null;
  // https://<ref>.supabase.co  →  <ref>
  const match = url.match(/https:\/\/([^.]+)\.supabase/);
  return match ? match[1] : null;
}

function getServiceRoleKey(): string | null {
  return process.env.SUPABASE_SERVICE_ROLE_KEY || null;
}

// Template type-lar
const TEMPLATE_TYPES = [
  "confirmation",
  "invite",
  "magic_link",
  "email_change",
  "recovery",
  "reauthentication",
] as const;

type TemplateType = (typeof TEMPLATE_TYPES)[number];

type TemplateData = {
  subject: string;
  content: string;
};

type AllTemplates = Record<TemplateType, TemplateData>;

// Supabase Management API-dən auth config oxumaq
async function fetchAuthConfig(projectRef: string, serviceRoleKey: string) {
  const res = await fetch(
    `https://api.supabase.com/v1/projects/${projectRef}/config/auth`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${serviceRoleKey}`,
        "Content-Type": "application/json",
      },
    }
  );

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Supabase API error (${res.status}): ${errorText}`);
  }

  return res.json();
}

// Supabase Management API-yə auth config yazmaq
async function updateAuthConfig(
  projectRef: string,
  serviceRoleKey: string,
  payload: Record<string, string>
) {
  const res = await fetch(
    `https://api.supabase.com/v1/projects/${projectRef}/config/auth`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${serviceRoleKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    }
  );

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Supabase API error (${res.status}): ${errorText}`);
  }

  return res.json();
}

// Auth config-dan template məlumatlarını çıxarmaq
function extractTemplates(config: Record<string, unknown>): AllTemplates {
  const templates: Partial<AllTemplates> = {};

  for (const type of TEMPLATE_TYPES) {
    const subjectKey = `MAILER_SUBJECTS_${type.toUpperCase()}`;
    const contentKey = `MAILER_TEMPLATES_${type.toUpperCase()}_CONTENT`;

    templates[type] = {
      subject: (config[subjectKey] as string) || "",
      content: (config[contentKey] as string) || "",
    };
  }

  return templates as AllTemplates;
}

// GET: Bütün email template-ləri gətir
export async function GET() {
  // Admin yoxlaması
  const supabase = await getSupabaseServerClient();
  const authCheck = await verifyAdmin(supabase);
  if (authCheck.error) {
    return NextResponse.json(
      { error: authCheck.error },
      { status: authCheck.status }
    );
  }

  const projectRef = getProjectRef();
  const serviceRoleKey = getServiceRoleKey();

  if (!projectRef || !serviceRoleKey) {
    return NextResponse.json(
      {
        error:
          "Supabase konfiqurasiyası natamamdır. NEXT_PUBLIC_SUPABASE_URL və SUPABASE_SERVICE_ROLE_KEY lazımdır.",
      },
      { status: 500 }
    );
  }

  try {
    const config = await fetchAuthConfig(projectRef, serviceRoleKey);
    const templates = extractTemplates(config);
    return NextResponse.json({ templates }, { status: 200 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Bilinməyən xəta";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// PUT: Email template-ləri yenilə
export async function PUT(req: NextRequest) {
  // Admin yoxlaması
  const supabase = await getSupabaseServerClient();
  const authCheck = await verifyAdmin(supabase);
  if (authCheck.error) {
    return NextResponse.json(
      { error: authCheck.error },
      { status: authCheck.status }
    );
  }

  const projectRef = getProjectRef();
  const serviceRoleKey = getServiceRoleKey();

  if (!projectRef || !serviceRoleKey) {
    return NextResponse.json(
      {
        error:
          "Supabase konfiqurasiyası natamamdır. NEXT_PUBLIC_SUPABASE_URL və SUPABASE_SERVICE_ROLE_KEY lazımdır.",
      },
      { status: 500 }
    );
  }

  try {
    const body = await req.json();
    const { templates } = body as { templates: Partial<AllTemplates> };

    if (!templates) {
      return NextResponse.json(
        { error: "Templates məlumatı tələb olunur" },
        { status: 400 }
      );
    }

    // Supabase Management API formatına çevir
    const payload: Record<string, string> = {};

    for (const type of TEMPLATE_TYPES) {
      if (templates[type]) {
        const subjectKey = `MAILER_SUBJECTS_${type.toUpperCase()}`;
        const contentKey = `MAILER_TEMPLATES_${type.toUpperCase()}_CONTENT`;

        if (templates[type]!.subject !== undefined) {
          payload[subjectKey] = templates[type]!.subject;
        }
        if (templates[type]!.content !== undefined) {
          payload[contentKey] = templates[type]!.content;
        }
      }
    }

    const updatedConfig = await updateAuthConfig(
      projectRef,
      serviceRoleKey,
      payload
    );
    const updatedTemplates = extractTemplates(updatedConfig);

    return NextResponse.json(
      { templates: updatedTemplates, success: true },
      { status: 200 }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Bilinməyən xəta";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
