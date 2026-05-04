import { NextResponse } from "next/server";
import type { CreateCategoryPayload } from "@wedding-hall/shared";
import { corsPreflight, withCors } from "@/lib/cors";
import { requireAdmin } from "@/lib/admin";

export const dynamic = "force-dynamic";

export async function OPTIONS(request: Request) {
  return corsPreflight(request);
}

export async function GET(request: Request) {
  const auth = await requireAdmin(request);
  if (!auth.ok) return auth.response;

  const { data, error } = await auth.adminDb
    .from("vendor_categories")
    .select("*")
    .order("display_order", { ascending: true });

  if (error) {
    console.error("GET /api/admin/categories error", error);
    return withCors(
      request,
      NextResponse.json({ error: "Could not load categories." }, { status: 500 }),
    );
  }

  return withCors(request, NextResponse.json({ categories: data }));
}

export async function POST(request: Request) {
  const auth = await requireAdmin(request);
  if (!auth.ok) return auth.response;

  let body: CreateCategoryPayload;
  try {
    body = (await request.json()) as CreateCategoryPayload;
  } catch {
    return withCors(
      request,
      NextResponse.json({ error: "Invalid JSON body." }, { status: 400 }),
    );
  }

  if (!body.name?.trim() || !body.slug?.trim()) {
    return withCors(
      request,
      NextResponse.json({ error: "name and slug are required." }, { status: 400 }),
    );
  }

  const { data, error } = await auth.adminDb
    .from("vendor_categories")
    .insert({
      name: body.name.trim(),
      slug: body.slug.trim(),
      wizard_step_key: body.wizard_step_key ?? null,
      display_order: body.display_order ?? 0,
    })
    .select("*")
    .single();

  if (error) {
    console.error("POST /api/admin/categories error", error);
    const conflict = error.code === "23505";
    return withCors(
      request,
      NextResponse.json(
        { error: conflict ? "Slug already exists." : "Could not create category." },
        { status: conflict ? 409 : 500 },
      ),
    );
  }

  return withCors(request, NextResponse.json({ category: data }, { status: 201 }));
}
