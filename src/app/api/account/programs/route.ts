import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase-server";
import { programs } from "@/modules/programs/config";

type ProgramProgress = {
  [slug: string]: {
    startedAt?: string;
    completedTasks?: string[];
    finishedAt?: string;
  };
};

function calculateTotalPoints(progress: ProgramProgress): number {
  let total = 0;
  for (const program of programs) {
    const entry = progress[program.slug];
    if (!entry || !Array.isArray(entry.completedTasks)) continue;
    for (const taskId of entry.completedTasks) {
      const task = program.tasks.find((t) => t.id === taskId);
      if (!task) continue;
      total += task.points;
    }
  }
  return total;
}

export async function GET() {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Fetch DB programs
  const { data: dbPrograms } = await supabase
    .from("programs")
    .select("*")
    .eq("is_active", true);

  const allPrograms = [
    ...programs,
    ...(dbPrograms || []).map((p) => ({
      id: String(p.id),
      slug: p.slug,
      title: p.title,
      description: p.description,
      imageUrl: p.image_url,
      duration: p.duration,
      price: p.price,
      isDbProgram: true,
    })),
  ];

  const meta =
    (user as { user_metadata?: Record<string, unknown> }).user_metadata || {};
  const rawProgress = meta.program_progress;

  const progress: ProgramProgress =
    rawProgress && typeof rawProgress === "object"
      ? (rawProgress as ProgramProgress)
      : {};

  const totalPoints = calculateTotalPoints(progress);

  return NextResponse.json(
    {
      programs: allPrograms,
      progress,
      totalPoints,
    },
    { status: 200 }
  );
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
  const slug = typeof body.slug === "string" ? body.slug : "";
  const action = typeof body.action === "string" ? body.action : "";
  const taskId = typeof body.taskId === "string" ? body.taskId : "";

  // Check if program exists (either in config or DB)
  const configProgram = programs.find((p) => p.slug === slug);
  let programExists = !!configProgram;
  let dbProgram = null;

  if (!programExists) {
    let query = supabase.from("programs").select("id, slug, title");
    
    // Check if slug looks like a UUID
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slug);
    // Check if slug looks like a numeric ID
    const isNumeric = /^\d+$/.test(slug);
    
    if (isUUID) {
      query = query.or(`slug.eq.${slug},id.eq.${slug}`);
    } else if (isNumeric) {
      query = query.or(`slug.eq.${slug},id.eq.${slug}`);
    } else {
      query = query.eq("slug", slug);
    }
    
    const { data } = await query.maybeSingle();
    dbProgram = data;
    programExists = !!dbProgram;
  }

  if (!programExists) {
    return NextResponse.json({ error: "Program not found" }, { status: 404 });
  }

  const meta =
    (user as { user_metadata?: Record<string, unknown> }).user_metadata || {};
  const rawProgress = meta.program_progress;

  const current: ProgramProgress =
    rawProgress && typeof rawProgress === "object"
      ? (rawProgress as ProgramProgress)
      : {};

  const next: ProgramProgress = { ...current };
  // Use the slug from the request as key, but if it's a numeric ID and we found a DB program with a real slug, maybe use that?
  // Consistency is key. AccountDashboard uses "effectiveSlug".
  // If we store it under "17", we must read it as "17".
  const storageKey = slug; 
  const existingEntry = next[storageKey] || {};

  if (action === "start") {
    next[storageKey] = {
      ...existingEntry,
      startedAt:
        existingEntry.startedAt || new Date().toISOString().slice(0, 19) + "Z",
      completedTasks: Array.isArray(existingEntry.completedTasks)
        ? existingEntry.completedTasks
        : [],
      finishedAt: existingEntry.finishedAt, 
    };
  } else if (action === "finish") {
    next[storageKey] = {
      ...existingEntry,
      finishedAt: new Date().toISOString().slice(0, 19) + "Z",
    };
  } else if (action === "completeTask") {
    // Only config programs support tasks for now
    if (!configProgram) {
       return NextResponse.json(
        { error: "Tasks not supported for this program" },
        { status: 400 }
      );
    }
    const taskExists = configProgram.tasks.some((t) => t.id === taskId);
    if (!taskExists) {
      return NextResponse.json(
        { error: "Task not found in program" },
        { status: 400 }
      );
    }
    const completed = Array.isArray(existingEntry.completedTasks)
      ? existingEntry.completedTasks.slice()
      : [];
    if (!completed.includes(taskId)) {
      completed.push(taskId);
    }
    next[storageKey] = {
      ...existingEntry,
      startedAt:
        existingEntry.startedAt || new Date().toISOString().slice(0, 19) + "Z",
      completedTasks: completed,
    };
  } else {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  const { error } = await supabase.auth.updateUser({
    data: {
      program_progress: next,
    },
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Also update profiles table for admin view
  // We don't block response on this, just fire and forget or await if critical
  await supabase
    .from("profiles")
    .update({ program_progress: next })
    .eq("id", user.id)
    .maybeSingle();

  const totalPoints = calculateTotalPoints(next);

  return NextResponse.json(
    {
      programs,
      progress: next,
      totalPoints,
    },
    { status: 200 }
  );
}

