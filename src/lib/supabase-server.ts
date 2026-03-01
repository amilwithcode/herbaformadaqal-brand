import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

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
