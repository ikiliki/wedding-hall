#!/usr/bin/env node
/* eslint-disable no-console */
/**
 * Inserts public.admin_users for E2E_ADMIN_EMAIL (must already exist in auth.users).
 * Requires: npx supabase login && npx supabase link --project-ref …
 *
 *   set E2E_ADMIN_EMAIL=you@example.com
 *   npm run e2e:grant-admin
 */
import { spawnSync } from "node:child_process";

const email = process.env.E2E_ADMIN_EMAIL?.trim();
if (!email) {
  console.error("Set E2E_ADMIN_EMAIL to an existing Auth user.");
  process.exit(1);
}

const escaped = email.replace(/'/g, "''");
const sql = `insert into public.admin_users (user_id, granted_by) select u.id, u.id from auth.users u where u.email = '${escaped}' on conflict (user_id) do nothing;`;

const r = spawnSync(
  "npx",
  ["supabase", "db", "query", "--linked", "--agent=no", "-c", sql],
  { stdio: "inherit", shell: true },
);

process.exit(r.status === null ? 1 : r.status);
