import { NextResponse } from "next/server";
import { corsPreflight, withCors } from "@/lib/cors";

export async function OPTIONS(request: Request) {
  return corsPreflight(request);
}

export async function GET(request: Request) {
  return withCors(
    request,
    NextResponse.json({
      ok: true,
      service: "wedding-hall-server",
      ts: new Date().toISOString(),
    }),
  );
}
