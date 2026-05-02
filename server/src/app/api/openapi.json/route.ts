import { NextResponse } from "next/server";
import { buildOpenApi } from "@/lib/openapi";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const origin = new URL(request.url).origin;
  return NextResponse.json(buildOpenApi(origin), {
    headers: {
      "cache-control": "public, max-age=60, s-maxage=300",
    },
  });
}
