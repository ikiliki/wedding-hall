// CORS helpers. The browser app runs on a different origin (Vite dev,
// or a vercel.app deploy in production) than the API, so every JSON
// route hands back the right access-control headers and answers
// preflight `OPTIONS` requests.

import { NextResponse } from "next/server";

// Hard-coded localhost defaults so `npm run dev:client` + docker-compose
// always work without setup.
const LOCAL_ORIGINS = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:3000",
];

function envAllowedOrigins(): string[] {
  return (process.env.CLIENT_ORIGIN ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

// Vercel hands every preview deployment a fresh `*.vercel.app` URL, so
// pinning `CLIENT_ORIGIN` to a single host means PR previews and
// re-named projects silently 404 with a CORS error. Allowing any
// vercel.app subdomain over HTTPS is safe here because:
//   * every server route requires a Supabase JWT — an unauthenticated
//     CORS request can read /api/health and that's it,
//   * Supabase RLS still enforces row ownership downstream,
//   * we never use cookies for auth (Authorization: Bearer only).
function isAllowedVercelOrigin(origin: string): boolean {
  try {
    const u = new URL(origin);
    return u.protocol === "https:" && u.hostname.endsWith(".vercel.app");
  } catch {
    return false;
  }
}

function isAllowedOrigin(origin: string): boolean {
  if (LOCAL_ORIGINS.includes(origin)) return true;
  if (envAllowedOrigins().includes(origin)) return true;
  if (isAllowedVercelOrigin(origin)) return true;
  return false;
}

function pickOrigin(req: Request): string | null {
  const origin = req.headers.get("origin");
  if (!origin) return null;
  return isAllowedOrigin(origin) ? origin : null;
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
