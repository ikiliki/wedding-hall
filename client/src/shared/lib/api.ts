// Wedding Hall API client.
//
// All non-auth data calls (profiles, wedding budgets) hit the Wedding Hall
// server, not Supabase directly. The browser keeps the Supabase session for
// auth (sign-in / sign-up / `exchangeCodeForSession`) and forwards the
// resulting JWT here as a bearer token. The server validates the token,
// then talks to Supabase with the same JWT so RLS still applies.

import type {
  Profile,
  SaveBudgetPayload,
  UpsertProfilePayload,
  WeddingBudget,
} from "@wedding-hall/shared";
import { createClient } from "@/shared/lib/supabase";

const SERVER_URL = (
  import.meta.env.VITE_SERVER_URL ?? "http://localhost:3001"
).replace(/\/$/, "");

export type ApiErrorKind = "unauthorized" | "tables_missing" | "validation" | "network" | "server";

export class ApiError extends Error {
  status: number;
  kind: ApiErrorKind;
  details?: unknown;
  constructor(opts: {
    message: string;
    status: number;
    kind: ApiErrorKind;
    details?: unknown;
  }) {
    super(opts.message);
    this.status = opts.status;
    this.kind = opts.kind;
    this.details = opts.details;
  }
}

async function bearerToken(): Promise<string> {
  const supabase = createClient();
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) {
    throw new ApiError({
      message: "Please sign in again.",
      status: 401,
      kind: "unauthorized",
    });
  }
  return token;
}

type RequestOpts = {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  body?: unknown;
};

async function request<T>(path: string, opts: RequestOpts = {}): Promise<T> {
  const token = await bearerToken();
  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    Accept: "application/json",
  };
  if (opts.body !== undefined) headers["Content-Type"] = "application/json";

  let res: Response;
  try {
    res = await fetch(`${SERVER_URL}${path}`, {
      method: opts.method ?? "GET",
      headers,
      body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
    });
  } catch (err) {
    throw new ApiError({
      message:
        "Could not reach the Wedding Hall server. Is it running at " +
        `${SERVER_URL}?`,
      status: 0,
      kind: "network",
      details: err,
    });
  }

  let parsed: unknown = null;
  const text = await res.text();
  if (text) {
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = text;
    }
  }

  if (!res.ok) {
    const body = (parsed ?? {}) as { error?: string; details?: unknown };
    let kind: ApiErrorKind = "server";
    if (res.status === 401) kind = "unauthorized";
    else if (res.status === 503) kind = "tables_missing";
    else if (res.status === 400) kind = "validation";
    const fallback =
      typeof parsed === "string" && parsed
        ? parsed
        : `Request failed (${res.status}).`;
    throw new ApiError({
      message: body.error ?? fallback,
      status: res.status,
      kind,
      details: body.details,
    });
  }

  return parsed as T;
}

// ---------- Profile ----------

export async function upsertProfile(
  payload: UpsertProfilePayload = {},
): Promise<Profile | null> {
  const data = await request<{ profile: Profile | null }>("/api/profiles", {
    method: "POST",
    body: payload,
  });
  return data.profile;
}

// ---------- Budget ----------

export async function fetchBudget(): Promise<WeddingBudget | null> {
  const data = await request<{ budget: WeddingBudget | null }>("/api/budget");
  return data.budget;
}

export async function saveBudget(
  payload: SaveBudgetPayload,
): Promise<WeddingBudget | null> {
  const data = await request<{ budget: WeddingBudget | null }>("/api/budget", {
    method: "PUT",
    body: payload,
  });
  return data.budget;
}
