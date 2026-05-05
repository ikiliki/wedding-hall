/* eslint-disable no-console */
import { readdir, rm } from "node:fs/promises";
import path from "node:path";
import { runId } from "./cleanup/run-id";
import { sweepRunId } from "./cleanup/supabase-admin";

export default async function globalTeardown() {
  const id = runId();
  if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    try {
      const { users, vendors } = await sweepRunId(id);
      console.log(`[e2e-teardown] swept run ${id}: ${users} users, ${vendors} vendors`);
    } catch (err) {
      console.error(`[e2e-teardown] sweep failed for run ${id}`, err);
    }
  }

  const authDir = path.join(process.cwd(), "playwright", ".auth");
  const files = await readdir(authDir).catch(() => [] as string[]);
  for (const f of files) {
    if (!f.includes(id)) continue;
    await rm(path.join(authDir, f), { force: true });
  }
}
