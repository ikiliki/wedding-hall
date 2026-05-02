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

  // Backwards compat with prod DBs that pre-date the Phase 2 columns
  // (`guest_count_min`, `guest_count_max`, `selections`). PostgREST replies
  // PGRST204 ("Could not find the X column ... in the schema cache") when
  // we send a column it doesn't know about. Strip empty Phase 2 fields,
  // and if PGRST204 still fires, retry without them entirely so the
  // legacy onboarding always succeeds.
  const PHASE_2_KEYS = ["guest_count_min", "guest_count_max", "selections"] as const;
  type Phase2Key = (typeof PHASE_2_KEYS)[number];

  const fullRow: Record<string, unknown> = { ...result.value };
  for (const key of PHASE_2_KEYS) {
    if (fullRow[key] == null) delete fullRow[key];
  }

  let { data, error } = await auth.supabase
    .from("wedding_budgets")
    .upsert(fullRow, { onConflict: "user_id" })
    .select("*")
    .maybeSingle();

  if (error?.code === "PGRST204" || error?.code === "42703") {
    // Either PostgREST schema cache or Postgres itself reports an unknown
    // column — fall back to the legacy column set.
    const legacyRow = { ...fullRow };
    for (const key of PHASE_2_KEYS as readonly Phase2Key[]) {
      delete legacyRow[key];
    }
    console.warn(
      "PUT /api/budget — DB is missing Phase 2 columns, retrying with legacy schema. " +
        "Run `supabase/schema.sql` against this project to enable the full wizard.",
      { code: error.code, message: error.message },
    );
    ({ data, error } = await auth.supabase
      .from("wedding_budgets")
      .upsert(legacyRow, { onConflict: "user_id" })
      .select("*")
      .maybeSingle());
  }

  if (error) {
    console.error("PUT /api/budget upsert error", {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
    });
    const tablesMissing =
      error.code === "42P01" ||
      /relation .* does not exist/i.test(error.message);
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
