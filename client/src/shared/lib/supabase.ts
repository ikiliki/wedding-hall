import {
  createClient as createSupabaseClient,
  type SupabaseClient,
} from "@supabase/supabase-js";

// One SDK instance per SPA load. Auth persistence uses sessionStorage instead
// of Supabase defaults (typically localStorage) so sessions retire with the tab.
let clientInstance: SupabaseClient | undefined;

export function createClient(): SupabaseClient {
  if (clientInstance) return clientInstance;

  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error(
      "Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY. Copy client/.env.example to client/.env.local.",
    );
  }

  const authOptions =
    typeof window !== "undefined"
      ? {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
          storage: window.sessionStorage,
        }
      : undefined;

  clientInstance = createSupabaseClient(url, key, {
    ...(authOptions ? { auth: authOptions } : {}),
  });
  return clientInstance;
}
