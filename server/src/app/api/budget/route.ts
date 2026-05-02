import { NextResponse } from "next/server";
import { corsPreflight, withCors } from "@/lib/cors";
import { supabaseForRequest } from "@/lib/supabase";
import { validateBudgetPayload } from "@/lib/budget";

export const dynamic = "force-dynamic";

export async function OPTIONS(request: Request) {
  return corsPreflight(request);
}

export async function GET(request: Request) {
  const auth = await supabaseForRequest(request);
  if (!auth.ok) return withCors(request, auth.response);

  const { data, error } = await auth.supabase
    .from("wedding_budgets")
    .select("*")
    .eq("user_id", auth.user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("GET /api/budget error", error);
    return withCors(
      request,
      NextResponse.json(
        { error: "Could not load budget.", code: error.code },
        { status: 500 },
      ),
    );
  }

  return withCors(request, NextResponse.json({ budget: data ?? null }));
}

export async function PUT(request: Request) {
  const auth = await supabaseForRequest(request);
  if (!auth.ok) return withCors(request, auth.response);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return withCors(
      request,
      NextResponse.json({ error: "Invalid JSON body." }, { status: 400 }),
    );
  }

  const result = validateBudgetPayload(body, auth.user.id);
  if (!result.ok) {
    return withCors(
      request,
      NextResponse.json({ error: "Validation failed.", details: result.errors }, { status: 400 }),
    );
  }

  const { data, error } = await auth.supabase
    .from("wedding_budgets")
    .upsert(result.value, { onConflict: "user_id" })
    .select("*")
    .maybeSingle();

  if (error) {
    // PostgREST sometimes returns a 404 with an empty body when its
    // schema cache is stale (the table was created after PostgREST
    // started). When that happens `error.code` is undefined and
    // `error.message` is empty — fall through to a generic message.
    console.error("PUT /api/budget upsert error", {
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
            : "Could not save budget.",
          code: error.code,
        },
        { status: tablesMissing ? 503 : 500 },
      ),
    );
  }

  return withCors(request, NextResponse.json({ budget: data }));
}
