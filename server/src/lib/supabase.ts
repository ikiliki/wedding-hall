// Server-side Supabase client factories.
//
// Two trust levels:
//   supabaseForRequest() — anon key + caller JWT; RLS still applies.
//     Used for all user-owned data (profiles, wedding_budgets).
//   supabaseServiceRole() — service-role key; bypasses RLS.
//     Used ONLY for admin endpoints (vendor CRUD, admin_users checks).
//     Never expose the service-role key to the browser.

import {
  createClient as createSupabaseClient,
  type SupabaseClient,
  type User,
} from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export type SupabaseEnv = {
  url: string;
  anonKey: string;
};

export function readSupabaseEnv(): SupabaseEnv {
  const url = process.env.SUPABASE_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    throw new Error(
      "Missing SUPABASE_URL or SUPABASE_ANON_KEY on the server. " +
        "Copy server/.env.example to server/.env.local (or set them on Vercel).",
    );
  }
  return { url, anonKey };
}

// Service-role client — bypasses RLS. Use only in admin route handlers
// after asserting the caller is in admin_users.
export function supabaseServiceRole(): SupabaseClient {
  const url = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error(
      "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. " +
        "Add SUPABASE_SERVICE_ROLE_KEY to server/.env.local (or Vercel).",
    );
  }
  return createSupabaseClient(url, serviceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}

// Build a Supabase client that runs as the calling user (RLS applies).
// Returns the client + the verified user.
export async function supabaseForRequest(
  req: Request,
): Promise<
  | { ok: true; supabase: SupabaseClient; user: User }
  | { ok: false; response: NextResponse }
> {
  const auth = req.headers.get("authorization") ?? req.headers.get("Authorization");
  if (!auth?.toLowerCase().startsWith("bearer ")) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Missing bearer token." },
        { status: 401 },
      ),
    };
  }
  const token = auth.slice("bearer ".length).trim();
  if (!token) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Empty bearer token." },
        { status: 401 },
      ),
    };
  }

  let env: SupabaseEnv;
  try {
    env = readSupabaseEnv();
  } catch (err) {
    console.error("supabaseForRequest env error", err);
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Server is not configured." },
        { status: 500 },
      ),
    };
  }

  const supabase = createSupabaseClient(env.url, env.anonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
    global: {
      headers: { Authorization: `Bearer ${token}` },
    },
  });

  // Verify the token with Auth (also lets us hand back the user object).
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Invalid or expired session." },
        { status: 401 },
      ),
    };
  }

  return { ok: true, supabase, user: data.user };
}
