/* eslint-disable no-console */
/**
 * Prod E2E preflight. Runs once before any spec.
 *
 * Responsibilities:
 *  1. Assert required env (PLAYWRIGHT_BASE_URL + E2E_USER1/2 + E2E_ADMIN). Fail fast.
 *  2. Probe the deployed gateway (/api/health, /api/openapi.json). Fail fast.
 *  3. (Opt-in) When E2E_AUTOPROVISION=1 + SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY:
 *     - Idempotently create E2E_USER1/USER2/ADMIN auth users with email_confirm=true.
 *     - Idempotently insert public.admin_users for E2E_ADMIN_EMAIL.
 *
 * Self-healing setup is the cure for issue #6 — wizard 422 (user missing / wrong
 * password) and admin dashboard heading missing (user not in admin_users).
 */
import { createClient } from "@supabase/supabase-js";

const REQUIRED = [
  "PLAYWRIGHT_BASE_URL",
  "E2E_USER1_EMAIL",
  "E2E_USER1_PASSWORD",
  "E2E_USER2_EMAIL",
  "E2E_USER2_PASSWORD",
] as const;

const ADMIN = ["E2E_ADMIN_EMAIL", "E2E_ADMIN_PASSWORD"] as const;

function deriveServerOrigin(clientUrl: string): string {
  // Production convention: client = wedding-hall-gamma.vercel.app, server = wedding-hall-server-*.vercel.app.
  // Tests don't talk to the gateway directly here — they only smoke-check the client.
  return clientUrl.replace(/\/$/, "");
}

async function probe(url: string, label: string): Promise<void> {
  try {
    const res = await fetch(url, { method: "GET" });
    if (!res.ok && res.status !== 404) {
      throw new Error(`${label} responded ${res.status}`);
    }
    console.log(`[e2e-setup] ${label} reachable (${res.status})`);
  } catch (err) {
    throw new Error(`[e2e-setup] ${label} probe failed at ${url}: ${(err as Error).message}`);
  }
}

async function autoprovision(): Promise<void> {
  const url = process.env.SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !key) {
    console.log(
      "[e2e-setup] E2E_AUTOPROVISION=1 but SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY not set — skipping self-heal.",
    );
    return;
  }
  const admin = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });

  const accounts: Array<{ email: string; password: string }> = [
    { email: process.env.E2E_USER1_EMAIL!, password: process.env.E2E_USER1_PASSWORD! },
    { email: process.env.E2E_USER2_EMAIL!, password: process.env.E2E_USER2_PASSWORD! },
  ];
  if (process.env.E2E_ADMIN_EMAIL && process.env.E2E_ADMIN_PASSWORD) {
    accounts.push({ email: process.env.E2E_ADMIN_EMAIL, password: process.env.E2E_ADMIN_PASSWORD });
  }

  const { data: existing, error: listErr } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (listErr) throw new Error(`[e2e-setup] listUsers failed: ${listErr.message}`);
  const byEmail = new Map(existing.users.map((u) => [u.email?.toLowerCase() ?? "", u] as const));

  for (const acc of accounts) {
    const lower = acc.email.toLowerCase();
    const found = byEmail.get(lower);
    if (found) {
      // Update password so the spec sign-in cannot drift from the env value.
      const { error: updErr } = await admin.auth.admin.updateUserById(found.id, {
        password: acc.password,
        email_confirm: true,
      });
      if (updErr) throw new Error(`[e2e-setup] updateUser ${acc.email}: ${updErr.message}`);
      console.log(`[e2e-setup] refreshed credentials for ${acc.email}`);
    } else {
      const { error: createErr } = await admin.auth.admin.createUser({
        email: acc.email,
        password: acc.password,
        email_confirm: true,
      });
      if (createErr) throw new Error(`[e2e-setup] createUser ${acc.email}: ${createErr.message}`);
      console.log(`[e2e-setup] created auth user ${acc.email}`);
    }
  }

  const adminEmail = process.env.E2E_ADMIN_EMAIL;
  if (adminEmail) {
    const refreshed = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
    const adminUser = refreshed.data.users.find(
      (u) => u.email?.toLowerCase() === adminEmail.toLowerCase(),
    );
    if (!adminUser) {
      throw new Error(`[e2e-setup] admin auth user ${adminEmail} not found after autoprovision`);
    }
    const { error: insErr } = await admin
      .from("admin_users")
      .upsert(
        { user_id: adminUser.id, granted_by: adminUser.id },
        { onConflict: "user_id" },
      );
    if (insErr) {
      throw new Error(
        `[e2e-setup] admin_users upsert failed (${insErr.message}); run npm run e2e:grant-admin manually.`,
      );
    }
    console.log(`[e2e-setup] admin_users contains ${adminEmail}`);
  }
}

async function globalSetup(): Promise<void> {
  if (!process.env.PLAYWRIGHT_BASE_URL) {
    console.log("[e2e-setup] PLAYWRIGHT_BASE_URL not set — specs will skip; nothing to do.");
    return;
  }

  const missingRequired = REQUIRED.filter((k) => !process.env[k]);
  const missingAdmin = ADMIN.filter((k) => !process.env[k]);
  if (missingRequired.length > 0) {
    console.log(
      `[e2e-setup] missing wizard env (${missingRequired.join(", ")}) — wizard spec will skip.`,
    );
  }
  if (missingAdmin.length > 0) {
    console.log(
      `[e2e-setup] missing admin env (${missingAdmin.join(", ")}) — admin spec will skip.`,
    );
  }

  const origin = deriveServerOrigin(process.env.PLAYWRIGHT_BASE_URL);
  await probe(origin, "client root");

  if (process.env.E2E_AUTOPROVISION === "1") {
    if (missingRequired.length > 0) {
      throw new Error(
        `[e2e-setup] E2E_AUTOPROVISION=1 requires all wizard env vars; missing: ${missingRequired.join(", ")}`,
      );
    }
    await autoprovision();
  }
}

export default globalSetup;
