// CORS helpers. The browser app runs on a different origin (Vite dev,
// or `wedding-hall-client.vercel.app` in production) than the API, so
// every JSON route hands back the right access-control headers and
// answers preflight `OPTIONS` requests.

import { NextResponse } from "next/server";

// Allowed origins. Defaults cover local Vite dev + the docker-compose
// client. In production set CLIENT_ORIGIN (comma-separated for multiple).
function allowedOrigins(): string[] {
  const fromEnv = (process.env.CLIENT_ORIGIN ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  return [...fromEnv, "http://localhost:5173", "http://127.0.0.1:5173"];
}

function pickOrigin(req: Request): string | null {
  const origin = req.headers.get("origin");
  if (!origin) return null;
  return allowedOrigins().includes(origin) ? origin : null;
}

export function corsHeaders(req: Request): Record<string, string> {
  const origin = pickOrigin(req);
  if (!origin) return {};
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Credentials": "true",
    Vary: "Origin",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Authorization, Content-Type",
    "Access-Control-Max-Age": "86400",
  };
}

export function withCors(req: Request, res: NextResponse): NextResponse {
  for (const [k, v] of Object.entries(corsHeaders(req))) {
    res.headers.set(k, v);
  }
  return res;
}

export function corsPreflight(req: Request): NextResponse {
  const headers = corsHeaders(req);
  // 204 No Content with the headers attached.
  return new NextResponse(null, { status: 204, headers });
}
