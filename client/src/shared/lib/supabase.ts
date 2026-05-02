import { createClient as createSupabaseClient } from "@supabase/supabase-js";

export function createClient() {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error(
      "Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY. Copy client/.env.example to client/.env.local.",
    );
  }
  return createSupabaseClient(url, key);
}
