"use client";
import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | null = null;

export function getSupabaseBrowserClient(): SupabaseClient {
  if (typeof window === "undefined") {
    return {
      auth: {
        signInWithPassword: async () => ({
          data: null,
          error: new Error("Auth not available in SSR"),
        }),
        signUp: async () => ({
          data: null,
          error: new Error("Auth not available in SSR"),
        }),
        getUser: async () => ({
          data: { user: null },
          error: new Error("Auth not available in SSR"),
        }),
      },
    } as unknown as SupabaseClient;
  }
  if (!client) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) {
      return {
        auth: {
          signInWithPassword: async () => ({
            data: null,
            error: new Error("Supabase env not configured"),
          }),
          signUp: async () => ({
            data: null,
            error: new Error("Supabase env not configured"),
          }),
          getUser: async () => ({
            data: { user: null },
            error: new Error("Supabase env not configured"),
          }),
        },
      } as unknown as SupabaseClient;
    }
    client = createBrowserClient(url, key);
  }
  return client;
}
