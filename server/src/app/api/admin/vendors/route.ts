import { NextResponse } from "next/server";
import type { CreateVendorPayload } from "@wedding-hall/shared";
import { corsPreflight, withCors } from "@/lib/cors";
import { requireAdmin } from "@/lib/admin";

export const dynamic = "force-dynamic";

export async function OPTIONS(request: Request) {
  return corsPreflight(request);
}

export async function GET(request: Request) {
  const auth = await requireAdmin(request);
  if (!auth.ok) return auth.response;

  const url = new URL(request.url);
  const categorySlug = url.searchParams.get("category");
  const showInactive = url.searchParams.get("include_inactive") === "true";

  let query = auth.adminDb
    .from("vendors")
    .select("*, category:vendor_categories(*)")
    .order("name", { ascending: true });

  if (!showInactive) query = query.eq("is_active", true);

  if (categorySlug) {
    const { data: cat } = await auth.adminDb
      .from("vendor_categories")
      .select("id")
      .eq("slug", categorySlug)
      .maybeSingle();
    if (cat) query = query.eq("category_id", cat.id);
  }

  const { data, error } = await query;

  if (error) {
    console.error("GET /api/admin/vendors error", error);
    return withCors(
      request,
      NextResponse.json({ error: "Could not load vendors." }, { status: 500 }),
    );
  }

  return withCors(request, NextResponse.json({ vendors: data }));
}

export async function POST(request: Request) {
  const auth = await requireAdmin(request);
  if (!auth.ok) return auth.response;

  let body: CreateVendorPayload;
  try {
    body = (await request.json()) as CreateVendorPayload;
  } catch {
    return withCors(
      request,
      NextResponse.json({ error: "Invalid JSON body." }, { status: 400 }),
    );
  }

  if (!body.name?.trim() || !body.category_id) {
    return withCors(
      request,
      NextResponse.json({ error: "name and category_id are required." }, { status: 400 }),
    );
  }

  const { data, error } = await auth.adminDb
    .from("vendors")
    .insert({
      category_id: body.category_id,
      name: body.name.trim(),
      phone: body.phone ?? null,
      website_url: body.website_url ?? null,
      photo_url: body.photo_url ?? null,
      description: body.description ?? null,
      city: body.city ?? null,
      price_range: body.price_range ?? null,
      created_by: auth.user.id,
    })
    .select("*, category:vendor_categories(*)")
    .single();

  if (error) {
    console.error("POST /api/admin/vendors error", error);
    return withCors(
      request,
      NextResponse.json({ error: "Could not create vendor." }, { status: 500 }),
    );
  }

  return withCors(request, NextResponse.json({ vendor: data }, { status: 201 }));
}
