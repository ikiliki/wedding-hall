import {
  createClient as createSupabaseClient,
  type SupabaseClient,
} from "@supabase/supabase-js";

// Single shared client per browser tab. Multiple `createClient()` calls used
// to spin up multiple GoTrueClient instances against the same storage key,
// which Supabase warns about as undefined behaviour.
let cached: SupabaseClient | null = null;

export function createClient(): SupabaseClient {
  if (cached) return cached;

  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error(
      "Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY. Copy client/.env.example to client/.env.local.",
    );
  }

  cached = createSupabaseClient(url, key);
  return cached;
}
