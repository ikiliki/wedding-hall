import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    ok: true,
    service: "wedding-hall-server",
    ts: new Date().toISOString(),
  });
}
