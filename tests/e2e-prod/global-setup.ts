/* eslint-disable no-console */
import { mkdirSync } from "node:fs";
import path from "node:path";
import { runId } from "./cleanup/run-id";

async function probe(url: string, label: string): Promise<void> {
  const res = await fetch(url, { method: "GET" });
  if (!res.ok && res.status !== 404) {
    throw new Error(`${label} responded ${res.status}`);
  }
  console.log(`[e2e-setup] ${label} reachable (${res.status})`);
}

async function globalSetup(): Promise<void> {
  process.env.PLAYWRIGHT_BASE_URL =
    process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:5173";

  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error(
      "[e2e-setup] SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required for fixture-based e2e tests.",
    );
  }

  const resolvedRunId = runId();
  process.env.E2E_RUN_ID = resolvedRunId;
  console.log(`[e2e-setup] run id: ${resolvedRunId}`);

  mkdirSync(path.join(process.cwd(), "playwright", ".auth"), { recursive: true });
  await probe(process.env.PLAYWRIGHT_BASE_URL.replace(/\/$/, ""), "client root");
}

export default globalSetup;
