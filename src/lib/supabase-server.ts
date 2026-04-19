import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const SUPABASE_CONFIGURED = Boolean(url && key);

export async function getSupabaseServerClient(): Promise<SupabaseClient> {
  if (!url || !key) {
    const emptyListResult = { data: [], error: null };
    const singleNullResult = { data: null, error: null };

    const selectBuilder = {
      eq: () => selectBuilder,
      order: () => emptyListResult,
      limit: () => emptyListResult,
      in: () => emptyListResult,
      maybeSingle: () => singleNullResult,
      single: () => singleNullResult,
    };

    return Promise.resolve({
      auth: {
        getUser: async () => ({
          data: { user: null },
          error: new Error("Supabase env not configured"),
        }),
      },
      from: () => ({
        select: () => selectBuilder,
        insert: () => ({
          select: () => ({
            single: () => ({ data: null, error: new Error("Supabase env not configured") }),
          }),
        }),
      }),
    } as unknown as SupabaseClient);
  }

  const cookieStore = await cookies();
  const client = createServerClient(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // ignore in server components where setAll may not be allowed
        }
      },
    },
  });
  return client as unknown as SupabaseClient;
}

/**
 * Keşləmə (unstable_cache) üçün cookies-dən asılı olmayan client.
 * Yalnız ictimai (public) məlumatları gətirmək üçün istifadə edin.
 */
export function getSupabasePublicClient(): SupabaseClient {
  if (!url || !key) {
    return {
      from: () => ({
        select: () => ({
          eq: () => ({ maybeSingle: async () => ({ data: null, error: null }) }),
        }),
      }),
    } as unknown as SupabaseClient;
  }
  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

/**
 * Admin əməliyyatları üçün Service Role client (RLS-i bypass edir).
 * Yalnız server-side API route-larında istifadə edin!
 */
export function getSupabaseAdminClient(): SupabaseClient {
  if (!url || !serviceRoleKey) {
    // Mock client (env konfiqurasiya edilməyibsə)
    const emptyListResult = { data: [] as unknown[], error: null };
    const singleNullResult = { data: null, error: null };

    const selectBuilder: Record<string, unknown> = {};
    const chainMethods = ["eq", "neq", "gt", "lt", "gte", "lte", "in", "is", "filter", "not"];
    chainMethods.forEach((m) => { selectBuilder[m] = () => selectBuilder; });
    selectBuilder.order = () => selectBuilder;
    selectBuilder.limit = () => emptyListResult;
    selectBuilder.maybeSingle = () => singleNullResult;
    selectBuilder.single = () => singleNullResult;
    selectBuilder.then = undefined; // Promise olmadığını bildirmək üçün

    return {
      auth: {
        getUser: async () => ({ data: { user: null }, error: new Error("Supabase not configured") }),
      },
      from: () => ({
        select: () => selectBuilder,
        insert: () => ({ select: () => ({ single: () => singleNullResult }) }),
        update: () => ({ eq: () => ({ data: null, error: null }) }),
        delete: () => ({ eq: () => ({ data: null, error: null }) }),
      }),
    } as unknown as SupabaseClient;
  }

  return createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
