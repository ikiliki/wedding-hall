// Admin guard for server route handlers.
//
// Usage:
//   const auth = await requireAdmin(request);
//   if (!auth.ok) return withCors(request, auth.response);
//   // auth.user and auth.adminDb (service-role client) are available

import { NextResponse } from "next/server";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import { supabaseForRequest, supabaseServiceRole } from "@/lib/supabase";
import { withCors } from "@/lib/cors";

type AdminAuth =
  | { ok: true; user: User; adminDb: SupabaseClient }
  | { ok: false; response: NextResponse };

export async function requireAdmin(request: Request): Promise<AdminAuth> {
  const auth = await supabaseForRequest(request);
  if (!auth.ok) return auth;

  let adminDb: SupabaseClient;
  try {
    adminDb = supabaseServiceRole();
  } catch (err) {
    console.error("requireAdmin: service role not configured", err);
    return {
      ok: false,
      response: withCors(
        request,
        NextResponse.json({ error: "Admin service not configured." }, { status: 503 }),
      ),
    };
  }

  const { data, error } = await adminDb
    .from("admin_users")
    .select("user_id")
    .eq("user_id", auth.user.id)
    .maybeSingle();

  if (error) {
    console.error("requireAdmin: db error", error);
    return {
      ok: false,
      response: withCors(
        request,
        NextResponse.json({ error: "Could not verify admin status." }, { status: 500 }),
      ),
    };
  }

  if (!data) {
    return {
      ok: false,
      response: withCors(
        request,
        NextResponse.json({ error: "Forbidden." }, { status: 403 }),
      ),
    };
  }

  return { ok: true, user: auth.user, adminDb };
}
