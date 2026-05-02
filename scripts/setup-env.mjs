#!/usr/bin/env node
/* eslint-disable no-console */

/**
 * Wedding Hall — env bootstrapper.
 *
 * One script, three modes:
 *
 *   node scripts/setup-env.mjs --local
 *       Write the docker-compose dev keys into client/.env.local and
 *       server/.env.local. Safe to re-run.
 *
 *   node scripts/setup-env.mjs --from-supabase --ref <project-ref>
 *                                              [--server-url https://you.vercel.app]
 *                                              [--client-origin https://you.vercel.app]
 *       Pull SUPABASE_URL + anon key from Supabase Cloud using the
 *       Supabase CLI (`supabase projects api-keys`). You must run
 *       `supabase login` once first.
 *
 *   node scripts/setup-env.mjs --push-vercel  --client-project <name>
 *                                             --server-project <name>
 *                                             [--env production|preview|development]
 *       Push the values currently in client/.env.local + server/.env.local
 *       to the matching Vercel projects via the `vercel` CLI. You must
 *       run `vercel login` once first.
 *
 * Manual steps the script can NOT do for you (because Supabase has no
 * public API for them on free projects): see the printed checklist after
 * `--from-supabase` completes — it covers Auth Site URL, Redirect URLs,
 * and toggling "Confirm email" off for the demo user.
 */

import { spawn, spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import process from "node:process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, "..");

// --------------------------------------------------------------------
// CLI parsing
// --------------------------------------------------------------------

function parseArgs(argv) {
  const args = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith("--")) {
      const key = a.slice(2);
      const next = argv[i + 1];
      if (next && !next.startsWith("--")) {
        args[key] = next;
        i++;
      } else {
        args[key] = true;
      }
    } else {
      args._.push(a);
    }
  }
  return args;
}

const args = parseArgs(process.argv.slice(2));

// --------------------------------------------------------------------
// .env file IO
// --------------------------------------------------------------------

function readEnv(path) {
  if (!existsSync(path)) return {};
  const out = {};
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const idx = trimmed.indexOf("=");
    if (idx === -1) continue;
    const key = trimmed.slice(0, idx).trim();
    let value = trimmed.slice(idx + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    out[key] = value;
  }
  return out;
}

function writeEnv(path, values, header) {
  mkdirSync(dirname(path), { recursive: true });
  const lines = [];
  if (header) {
    for (const h of header.split("\n")) lines.push(`# ${h}`);
    lines.push("");
  }
  for (const [k, v] of Object.entries(values)) {
    lines.push(`${k}=${v ?? ""}`);
  }
  writeFileSync(path, lines.join("\n") + "\n", "utf8");
  console.log(`  wrote ${path}`);
}

// --------------------------------------------------------------------
// CLI helpers
// --------------------------------------------------------------------

function which(cmd) {
  // npx will resolve the local binary; first try the system PATH.
  const checker = process.platform === "win32" ? "where" : "which";
  const r = spawnSync(checker, [cmd], { stdio: "pipe" });
  return r.status === 0;
}

function runJson(cmd, cmdArgs) {
  const r = spawnSync(cmd, cmdArgs, {
    stdio: ["ignore", "pipe", "pipe"],
    encoding: "utf8",
  });
  if (r.status !== 0) {
    throw new Error(
      `${cmd} ${cmdArgs.join(" ")} failed (${r.status}):\n${r.stderr || r.stdout}`,
    );
  }
  try {
    return JSON.parse(r.stdout);
  } catch {
    throw new Error(
      `${cmd} ${cmdArgs.join(" ")} did not return JSON:\n${r.stdout}`,
    );
  }
}

function runStream(cmd, cmdArgs, { input } = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, cmdArgs, {
      stdio: [input ? "pipe" : "ignore", "inherit", "inherit"],
    });
    if (input) {
      child.stdin.write(input);
      child.stdin.end();
    }
    child.on("error", reject);
    child.on("exit", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${cmd} ${cmdArgs.join(" ")} exited ${code}`));
    });
  });
}

// --------------------------------------------------------------------
// Mode: --local
// --------------------------------------------------------------------

const LOCAL_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6IndlZGRpbmctaGFsbC1sb2NhbCIsImlhdCI6MTY0MTc2OTIwMCwiZXhwIjoxNzk5NTM1NjAwfQ.JxejbUaxXmfGDcu7-FsaoReqSHXWG1CRnKUwq06VX3o";

function modeLocal() {
  console.log("Writing local docker-stack env files…");
  writeEnv(
    join(REPO_ROOT, "client/.env.local"),
    {
      VITE_SUPABASE_URL: "http://localhost:54321",
      VITE_SUPABASE_ANON_KEY: LOCAL_ANON_KEY,
      VITE_SERVER_URL: "http://localhost:3001",
    },
    "Generated by scripts/setup-env.mjs --local. Dev-only keys.",
  );
  writeEnv(
    join(REPO_ROOT, "server/.env.local"),
    {
      SUPABASE_URL: "http://localhost:54321",
      SUPABASE_ANON_KEY: LOCAL_ANON_KEY,
      CLIENT_ORIGIN: "http://localhost:5173",
    },
    "Generated by scripts/setup-env.mjs --local. Dev-only keys.",
  );
  console.log("\nDone. You can now run either:");
  console.log("  docker compose up -d --build");
  console.log("  npm run dev:client   # in one shell");
  console.log("  npm run dev:server   # in another");
}

// --------------------------------------------------------------------
// Mode: --from-supabase --ref <project-ref>
// --------------------------------------------------------------------

async function modeFromSupabase() {
  const ref = args.ref;
  if (!ref) {
    console.error("--from-supabase requires --ref <project-ref>");
    console.error(
      "Find it at https://supabase.com/dashboard/project/<ref> (the URL).",
    );
    process.exit(1);
  }

  if (!which("supabase")) {
    console.error("Supabase CLI not found. Install:");
    console.error("  npm i -g supabase    # or: brew install supabase/tap/supabase");
    console.error("  supabase login       # one-time");
    process.exit(1);
  }

  console.log(`Fetching API keys for project ${ref}…`);
  const keys = runJson("supabase", [
    "projects",
    "api-keys",
    "--project-ref",
    ref,
    "--output",
    "json",
  ]);
  const anon = keys.find((k) => k.name === "anon");
  if (!anon?.api_key) {
    throw new Error("Could not find an 'anon' key in `supabase projects api-keys` output.");
  }
  const supabaseUrl = `https://${ref}.supabase.co`;
  const serverUrl = args["server-url"] ?? "http://localhost:3001";
  const clientOrigin = args["client-origin"] ?? "";

  writeEnv(
    join(REPO_ROOT, "client/.env.local"),
    {
      VITE_SUPABASE_URL: supabaseUrl,
      VITE_SUPABASE_ANON_KEY: anon.api_key,
      VITE_SERVER_URL: serverUrl,
    },
    `Generated by scripts/setup-env.mjs --from-supabase --ref ${ref}`,
  );
  writeEnv(
    join(REPO_ROOT, "server/.env.local"),
    {
      SUPABASE_URL: supabaseUrl,
      SUPABASE_ANON_KEY: anon.api_key,
      CLIENT_ORIGIN: clientOrigin,
    },
    `Generated by scripts/setup-env.mjs --from-supabase --ref ${ref}`,
  );

  console.log("\nDone.");
  console.log("\nManual checklist (Supabase dashboard → Authentication → URL configuration):");
  console.log("  1. Site URL = your production client URL");
  console.log("  2. Redirect URLs include:");
  console.log("       http://localhost:5173/auth/callback");
  console.log("       https://<your-client-prod>/auth/callback");
  console.log("  3. Auth → Providers → Email: 'Confirm email' OFF if you want to use the demo seed user.");
  console.log("  4. SQL Editor → run supabase/seed.sql once.");
}

// --------------------------------------------------------------------
// Mode: --push-vercel
// --------------------------------------------------------------------

async function pushVercel(projectName, envName, values) {
  console.log(`\n→ Pushing ${Object.keys(values).length} vars to Vercel project '${projectName}' (${envName})…`);
  for (const [key, value] of Object.entries(values)) {
    if (!value) {
      console.log(`  - skip ${key} (empty)`);
      continue;
    }
    // `vercel env rm <key> <env> -y` ignores not-found, so we always remove
    // first so re-runs are idempotent.
    await runStream("vercel", [
      "env",
      "rm",
      key,
      envName,
      "--yes",
      "--scope",
      args.scope ?? "personal",
      "--cwd",
      REPO_ROOT,
      ...(projectName ? ["--project", projectName] : []),
    ]).catch(() => {});
    await runStream(
      "vercel",
      [
        "env",
        "add",
        key,
        envName,
        "--scope",
        args.scope ?? "personal",
        "--cwd",
        REPO_ROOT,
        ...(projectName ? ["--project", projectName] : []),
      ],
      { input: `${value}\n` },
    );
    console.log(`  + ${key}`);
  }
}

async function modePushVercel() {
  const clientProject = args["client-project"];
  const serverProject = args["server-project"];
  if (!clientProject || !serverProject) {
    console.error(
      "--push-vercel requires --client-project <name> --server-project <name>",
    );
    process.exit(1);
  }
  if (!which("vercel")) {
    console.error("Vercel CLI not found. Install:");
    console.error("  npm i -g vercel");
    console.error("  vercel login   # one-time");
    process.exit(1);
  }

  const envName = args.env ?? "production";
  const clientEnv = readEnv(join(REPO_ROOT, "client/.env.local"));
  const serverEnv = readEnv(join(REPO_ROOT, "server/.env.local"));

  if (!clientEnv.VITE_SUPABASE_URL || !clientEnv.VITE_SUPABASE_ANON_KEY) {
    console.error(
      "client/.env.local is empty or missing VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY.",
    );
    console.error(
      "Run --local or --from-supabase first to populate it, or fill it in by hand.",
    );
    process.exit(1);
  }
  if (!serverEnv.SUPABASE_URL || !serverEnv.SUPABASE_ANON_KEY) {
    console.error(
      "server/.env.local is empty or missing SUPABASE_URL / SUPABASE_ANON_KEY.",
    );
    process.exit(1);
  }

  await pushVercel(clientProject, envName, {
    VITE_SUPABASE_URL: clientEnv.VITE_SUPABASE_URL,
    VITE_SUPABASE_ANON_KEY: clientEnv.VITE_SUPABASE_ANON_KEY,
    VITE_SERVER_URL: clientEnv.VITE_SERVER_URL,
  });
  await pushVercel(serverProject, envName, {
    SUPABASE_URL: serverEnv.SUPABASE_URL,
    SUPABASE_ANON_KEY: serverEnv.SUPABASE_ANON_KEY,
    CLIENT_ORIGIN: serverEnv.CLIENT_ORIGIN,
  });

  console.log("\nDone. Trigger a redeploy on each Vercel project to pick up the new vars.");
}

// --------------------------------------------------------------------
// Entrypoint
// --------------------------------------------------------------------

async function main() {
  if (args.local) {
    modeLocal();
    return;
  }
  if (args["from-supabase"]) {
    await modeFromSupabase();
    return;
  }
  if (args["push-vercel"]) {
    await modePushVercel();
    return;
  }

  console.log(
    "Usage:\n" +
      "  node scripts/setup-env.mjs --local\n" +
      "  node scripts/setup-env.mjs --from-supabase --ref <project-ref> [--server-url URL] [--client-origin URL]\n" +
      "  node scripts/setup-env.mjs --push-vercel --client-project NAME --server-project NAME [--env production|preview|development]\n" +
      "\n" +
      "See .cursor/skills/wedding-hall-env-bootstrap/SKILL.md for the full guide.",
  );
}

main().catch((err) => {
  console.error("\nsetup-env failed:");
  console.error(err.message ?? err);
  process.exit(1);
});
