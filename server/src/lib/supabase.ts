// Server-side Supabase client factory.
//
// Trust model: the browser keeps doing auth (signin/signup/callback) directly
// against Supabase Auth. Every protected request to *this* server arrives with
// the user's JWT in the `Authorization` header. We forward that header into a
// per-request Supabase client so Postgres RLS still enforces row ownership —
// we never use a service-role key here.

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
