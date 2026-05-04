import { NextResponse } from "next/server";
import { corsPreflight, withCors } from "@/lib/cors";
import { supabaseForRequest } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function OPTIONS(request: Request) {
  return corsPreflight(request);
}

/** Authenticated couples: list active vendors (RLS `vendors_select_active`). */
export async function GET(request: Request) {
  const auth = await supabaseForRequest(request);
  if (!auth.ok) return withCors(request, auth.response);

  const { data, error } = await auth.supabase
    .from("vendors")
    .select("*, category:vendor_categories(*)")
    .eq("is_active", true)
    .order("name", { ascending: true });

  if (error) {
    console.error("GET /api/vendors error", error);
    return withCors(
      request,
      NextResponse.json({ error: "Could not load vendors." }, { status: 500 }),
    );
  }

  return withCors(request, NextResponse.json({ vendors: data ?? [] }));
}
