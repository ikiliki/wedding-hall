import { NextResponse } from "next/server";
import { buildOpenApi } from "@/lib/openapi";
import { corsPreflight, withCors } from "@/lib/cors";

export const dynamic = "force-dynamic";

export async function OPTIONS(request: Request) {
  return corsPreflight(request);
}

export async function GET(request: Request) {
  const origin = new URL(request.url).origin;
  return withCors(
    request,
    NextResponse.json(buildOpenApi(origin), {
      headers: {
        "cache-control": "public, max-age=60, s-maxage=300",
      },
    }),
  );
}
