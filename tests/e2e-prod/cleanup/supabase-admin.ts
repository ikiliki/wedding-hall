import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Vendor } from "@wedding-hall/shared";
import { assertSafeEmail, assertSafeVendorName } from "./allowlist.mjs";
import { runId } from "./run-id";

export interface SeededUser {
  id: string;
  email: string;
  password: string;
}

export interface SeededVendor {
  id: string;
  name: string;
}

function env(name: "SUPABASE_URL" | "SUPABASE_SERVICE_ROLE_KEY"): string {
  const val = process.env[name]?.trim();
  if (!val) throw new Error(`Missing required env ${name}`);
  return val;
}

let cached: SupabaseClient | null = null;

export function adminClient(): SupabaseClient {
  if (cached) return cached;
  cached = createClient(env("SUPABASE_URL"), env("SUPABASE_SERVICE_ROLE_KEY"), {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
  return cached;
}

function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 60);
}

function workerTag(): string {
  const idx = process.env.TEST_WORKER_INDEX ?? "0";
  return `w${idx}`;
}

export async function createSeededUser(opts: {
  slug: string;
  password: string;
}): Promise<SeededUser> {
  const tag = `${runId()}-${workerTag()}-${slugify(opts.slug)}`;
  const email = `wh-e2e-${tag}@example.com`;
  const password = opts.password;
  const admin = adminClient();
  let { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if ((error || !data.user) && error?.message?.includes("checking email")) {
    assertSafeEmail(email);
    const listed = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
    const existing = listed.data?.users.find(
      (u) => u.email?.toLowerCase() === email.toLowerCase(),
    );
    if (existing) {
      await admin.auth.admin.deleteUser(existing.id);
      ({ data, error } = await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      }));
    }
  }
  if (error || !data?.user) {
    throw new Error(`createSeededUser failed (${email}): ${error?.message ?? "unknown"}`);
  }
  return { id: data.user.id, email, password };
}

export async function deleteSeededUser(user: SeededUser): Promise<void> {
  assertSafeEmail(user.email);
  const admin = adminClient();
  await admin.from("vendors").update({ created_by: null }).eq("created_by", user.id);
  await admin.from("admin_users").delete().eq("user_id", user.id);
  const { error } = await admin.auth.admin.deleteUser(user.id);
  if (error) {
    throw new Error(`deleteSeededUser failed (${user.email}): ${error.message}`);
  }
}

export async function grantAdmin(user: SeededUser): Promise<void> {
  const admin = adminClient();
  const { error } = await admin
    .from("admin_users")
    .upsert({ user_id: user.id, granted_by: user.id }, { onConflict: "user_id" });
  if (error) throw new Error(`grantAdmin failed (${user.email}): ${error.message}`);
}

export async function createSeededVendor(opts: {
  slug: string;
  categoryId: string;
}): Promise<SeededVendor> {
  const admin = adminClient();
  const name = `Playwright-E2E-${runId()}-${slugify(opts.slug)}`;
  const payload: Pick<Vendor, "name" | "category_id" | "city"> = {
    name,
    category_id: opts.categoryId,
    city: "תל אביב",
  };
  const { data, error } = await admin
    .from("vendors")
    .insert(payload)
    .select("id,name")
    .single();
  if (error || !data) {
    throw new Error(`createSeededVendor failed (${name}): ${error?.message}`);
  }
  return { id: data.id as string, name: data.name as string };
}

export async function deleteSeededVendor(vendor: SeededVendor): Promise<void> {
  assertSafeVendorName(vendor.name);
  const admin = adminClient();
  const { error } = await admin.from("vendors").delete().eq("id", vendor.id);
  if (error) {
    throw new Error(`deleteSeededVendor failed (${vendor.name}): ${error.message}`);
  }
}

export async function firstCategoryId(): Promise<string> {
  const admin = adminClient();
  const { data, error } = await admin
    .from("vendor_categories")
    .select("id")
    .order("display_order", { ascending: true })
    .limit(1);
  if (error || !data?.[0]?.id) {
    throw new Error(`firstCategoryId failed: ${error?.message ?? "no categories"}`);
  }
  return data[0].id as string;
}

export async function sweepRunId(id: string): Promise<{ users: number; vendors: number }> {
  const admin = adminClient();
  let users = 0;
  let vendors = 0;

  const emailPrefix = `wh-e2e-${id}`;
  const { data: listedUsers, error: usersErr } = await admin.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  });
  if (usersErr) throw new Error(`sweepRunId listUsers failed: ${usersErr.message}`);
  for (const u of listedUsers.users) {
    const email = u.email ?? "";
    if (!email.toLowerCase().startsWith(emailPrefix.toLowerCase())) continue;
    assertSafeEmail(email);
    await admin.from("vendors").update({ created_by: null }).eq("created_by", u.id);
    await admin.from("admin_users").delete().eq("user_id", u.id);
    const { error } = await admin.auth.admin.deleteUser(u.id);
    if (error) throw new Error(`sweepRunId delete user failed (${email}): ${error.message}`);
    users += 1;
  }

  const vendorPrefix = `Playwright-E2E-${id}-`;
  const { data: listedVendors, error: vendorsErr } = await admin
    .from("vendors")
    .select("id,name")
    .ilike("name", `${vendorPrefix}%`);
  if (vendorsErr) throw new Error(`sweepRunId list vendors failed: ${vendorsErr.message}`);
  for (const v of listedVendors ?? []) {
    const name = String(v.name ?? "");
    assertSafeVendorName(name);
    const { error } = await admin.from("vendors").delete().eq("id", v.id);
    if (error) throw new Error(`sweepRunId delete vendor failed (${name}): ${error.message}`);
    vendors += 1;
  }

  return { users, vendors };
}
