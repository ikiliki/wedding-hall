import { NextResponse } from "next/server";
import type { UpdateVendorPayload } from "@wedding-hall/shared";
import { corsPreflight, withCors } from "@/lib/cors";
import { requireAdmin } from "@/lib/admin";

export const dynamic = "force-dynamic";

export async function OPTIONS(request: Request) {
  return corsPreflight(request);
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdmin(request);
  if (!auth.ok) return auth.response;

  const { id } = await params;

  const { data, error } = await auth.adminDb
    .from("vendors")
    .select("*, category:vendor_categories(*)")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("GET /api/admin/vendors/[id] error", error);
    return withCors(
      request,
      NextResponse.json({ error: "Could not load vendor." }, { status: 500 }),
    );
  }
  if (!data) {
    return withCors(request, NextResponse.json({ error: "Not found." }, { status: 404 }));
  }

  return withCors(request, NextResponse.json({ vendor: data }));
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdmin(request);
  if (!auth.ok) return auth.response;

  const { id } = await params;

  let body: UpdateVendorPayload;
  try {
    body = (await request.json()) as UpdateVendorPayload;
  } catch {
    return withCors(
      request,
      NextResponse.json({ error: "Invalid JSON body." }, { status: 400 }),
    );
  }

  const patch: Record<string, unknown> = {};
  if (body.name !== undefined) patch.name = body.name?.trim() ?? null;
  if (body.category_id !== undefined) patch.category_id = body.category_id;
  if (body.phone !== undefined) patch.phone = body.phone;
  if (body.website_url !== undefined) patch.website_url = body.website_url;
  if (body.photo_url !== undefined) patch.photo_url = body.photo_url;
  if (body.description !== undefined) patch.description = body.description;
  if (body.city !== undefined) patch.city = body.city;
  if (body.price_range !== undefined) patch.price_range = body.price_range;
  if (body.is_active !== undefined) patch.is_active = body.is_active;

  if (Object.keys(patch).length === 0) {
    return withCors(
      request,
      NextResponse.json({ error: "No fields to update." }, { status: 400 }),
    );
  }

  const { data, error } = await auth.adminDb
    .from("vendors")
    .update(patch)
    .eq("id", id)
    .select("*, category:vendor_categories(*)")
    .maybeSingle();

  if (error) {
    console.error("PUT /api/admin/vendors/[id] error", error);
    return withCors(
      request,
      NextResponse.json({ error: "Could not update vendor." }, { status: 500 }),
    );
  }
  if (!data) {
    return withCors(request, NextResponse.json({ error: "Not found." }, { status: 404 }));
  }

  return withCors(request, NextResponse.json({ vendor: data }));
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdmin(request);
  if (!auth.ok) return auth.response;

  const { id } = await params;

  // Soft-delete: set is_active = false.
  const { error } = await auth.adminDb
    .from("vendors")
    .update({ is_active: false })
    .eq("id", id);

  if (error) {
    console.error("DELETE /api/admin/vendors/[id] error", error);
    return withCors(
      request,
      NextResponse.json({ error: "Could not deactivate vendor." }, { status: 500 }),
    );
  }

  return withCors(request, new NextResponse(null, { status: 204 }));
}
