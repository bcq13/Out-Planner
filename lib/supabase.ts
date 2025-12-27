import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    // Don't crash builds; return a clear runtime error when the route is hit.
    throw new Error("SUPABASE_ENV_MISSING");
  }

  if (!client) client = createClient(url, key);
  return client;
}
