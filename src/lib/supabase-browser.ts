"use client";
import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | null = null;

const isInvalidRefreshTokenError = (err: { message?: string } | null) =>
  err?.message?.includes("Refresh Token") ||
  err?.message?.includes("refresh_token") ||
  err?.message?.includes("Invalid Refresh Token");

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
    const rawClient = createBrowserClient(url, key);
    const originalGetUser = rawClient.auth.getUser.bind(rawClient.auth);
    rawClient.auth.getUser = async () => {
      const result = await originalGetUser();
      if (result.error && isInvalidRefreshTokenError(result.error)) {
        await rawClient.auth.signOut();
        const next = typeof window !== "undefined" ? encodeURIComponent(window.location.pathname) : "";
        window.location.href = `/auth/login${next ? `?next=${next}` : ""}`;
        return { data: { user: null }, error: result.error };
      }
      return result;
    };
    const originalGetSession = rawClient.auth.getSession?.bind(rawClient.auth);
    if (originalGetSession) {
      rawClient.auth.getSession = async () => {
        const result = await originalGetSession();
        if (result.error && isInvalidRefreshTokenError(result.error)) {
          await rawClient.auth.signOut();
          const next = typeof window !== "undefined" ? encodeURIComponent(window.location.pathname) : "";
          window.location.href = `/auth/login${next ? `?next=${next}` : ""}`;
          return { data: { session: null }, error: result.error };
        }
        return result;
      };
    }
    client = rawClient;
  }
  return client;
}
