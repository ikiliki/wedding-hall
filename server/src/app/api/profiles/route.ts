import { NextResponse } from "next/server";
import type { UpsertProfilePayload } from "@wedding-hall/shared";
import { corsPreflight, withCors } from "@/lib/cors";
import { supabaseForRequest } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function OPTIONS(request: Request) {
  return corsPreflight(request);
}

export async function POST(request: Request) {
  const auth = await supabaseForRequest(request);
  if (!auth.ok) return withCors(request, auth.response);

  let body: UpsertProfilePayload | null = null;
  try {
    body = (await request.json()) as UpsertProfilePayload;
  } catch {
    body = {};
  }

  const email =
    typeof body?.email === "string"
      ? body.email
      : (auth.user.email ?? null);
  const fullName =
    typeof body?.full_name === "string"
      ? body.full_name
      : ((auth.user.user_metadata?.full_name as string | undefined) ??
          (auth.user.user_metadata?.name as string | undefined) ??
          null);

  const { data, error } = await auth.supabase
    .from("profiles")
    .upsert(
      {
        id: auth.user.id,
        email,
        full_name: fullName,
      },
      { onConflict: "id" },
    )
    .select("*")
    .maybeSingle();

  if (error) {
    console.error("POST /api/profiles upsert error", {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
    });
    const tablesMissing =
      error.code === "42P01" || /relation .* does not exist/i.test(error.message);
    return withCors(
      request,
      NextResponse.json(
        {
          error: tablesMissing
            ? "Database tables are missing. Run supabase/seed.sql once."
            : "Could not save profile.",
          code: error.code,
        },
        { status: tablesMissing ? 503 : 500 },
      ),
    );
  }

  // Derive is_admin from admin_users using the caller's JWT. RLS policy
  // admin_users_select_own allows each user to read their own row — no service
  // role required (avoids false negatives when Vercel lacks SUPABASE_SERVICE_ROLE_KEY).
  let is_admin = false;
  const { data: adminRow, error: adminErr } = await auth.supabase
    .from("admin_users")
    .select("user_id")
    .eq("user_id", auth.user.id)
    .maybeSingle();
  if (adminErr) {
    console.error("POST /api/profiles admin_users lookup", adminErr);
  } else {
    is_admin = !!adminRow;
  }

  return withCors(request, NextResponse.json({ profile: { ...data, is_admin } }));
}
