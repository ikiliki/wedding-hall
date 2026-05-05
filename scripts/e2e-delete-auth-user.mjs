#!/usr/bin/env node
/* eslint-disable no-console */
/**
 * Deletes a single auth.users row by email (Admin API + service role).
 * Cascades to public.profiles / wedding_budgets per schema FKs.
 *
 *   set SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, E2E_DELETE_EMAIL
 *   npm run e2e:delete-auth-user
 *
 * Or: node scripts/e2e-delete-auth-user.mjs user@example.com
 */
import { createClient } from "@supabase/supabase-js";

const email = (process.argv[2] ?? process.env.E2E_DELETE_EMAIL ?? "").trim();
const url = process.env.SUPABASE_URL?.trim();
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

if (!email) {
  console.error("Pass email argv or set E2E_DELETE_EMAIL.");
  process.exit(1);
}
if (!url || !serviceKey) {
  console.error("Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (Supabase dashboard → API → service_role).");
  process.exit(1);
}

const supabase = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
});

const { data, error } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
if (error) {
  console.error("listUsers:", error.message);
  process.exit(1);
}

const user = data.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
if (!user) {
  console.log(`No auth user for ${email} (already deleted or never created).`);
  process.exit(0);
}

const { error: delErr } = await supabase.auth.admin.deleteUser(user.id);
if (delErr) {
  console.error("deleteUser:", delErr.message);
  process.exit(1);
}

console.log(`Deleted auth user ${email} (${user.id}).`);
