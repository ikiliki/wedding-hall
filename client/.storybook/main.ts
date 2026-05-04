import type { StorybookConfig } from "@storybook/react-vite";
import fs from "node:fs";
import path from "node:path";
import { mergeConfig, type AliasOptions } from "vite";

/** Hoisted vs nested `node_modules` (Docker volumes / npm workspaces). */
function resolveNodeModuleDir(pkg: string): string {
  const rootNm = path.resolve(__dirname, "../../node_modules", pkg);
  const clientNm = path.resolve(__dirname, "../node_modules", pkg);
  if (fs.existsSync(path.join(rootNm, "package.json"))) return rootNm;
  if (fs.existsSync(path.join(clientNm, "package.json"))) return clientNm;
  return rootNm;
}

const SUPABASE_MOCK = path.resolve(
  __dirname,
  "../src/storybook/mocks/supabase-client.ts",
);

/** Resolve workspace package to concrete `.ts` files so Vite never 403s parent-dir imports. */
const SHARED_SRC = path.resolve(__dirname, "../../packages/shared/src");

/** Same localhost anon key as `docker-compose` `client` / `storybook` (dev-only). */
const FALLBACK_LOCAL_VITE_SUPABASE_ANON =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6IndlZGRpbmctaGFsbC1sb2NhbCIsImlhdCI6MTY0MTc2OTIwMCwiZXhwIjoxNzk5NTM1NjAwfQ.JxejbUaxXmfGDcu7-FsaoReqSHXWG1CRnKUwq06VX3o";

function viteEnv(name: string, fallback: string): string {
  const v = process.env[name];
  return typeof v === "string" && v.length > 0 ? v : fallback;
}

type AliasEntry = { find: string | RegExp; replacement: string };

/**
 * `@` resolves before a record key `@/shared/lib/supabase`. Use an alias
 * **array** and put the Supabase shim first so Storybook loads the mock client.
 * Also add an exact-regex entry—some merges treat `@` before string keys.
 */
function mergeSupabaseStorybookAlias(existing: AliasOptions | undefined): AliasEntry[] {
  const rest: AliasEntry[] = [];

  if (Array.isArray(existing)) {
    for (const item of existing) {
      if (typeof item === "object" && item !== null && "find" in item && "replacement" in item) {
        const find = item.find as string | RegExp;
        if (typeof find === "string" && find === "@/shared/lib/supabase") continue;
        rest.push(item as AliasEntry);
      }
    }
  } else if (existing && typeof existing === "object") {
    for (const [find, replacement] of Object.entries(existing)) {
      if (find === "@/shared/lib/supabase") continue;
      if (typeof replacement === "string") {
        rest.push({ find, replacement });
      }
    }
  }

  return [
    { find: /^@\/shared\/lib\/supabase$/, replacement: SUPABASE_MOCK },
    { find: "@/shared/lib/supabase", replacement: SUPABASE_MOCK },
    {
      find: /^msw-storybook-addon$/,
      replacement: resolveNodeModuleDir("msw-storybook-addon"),
    },
    { find: /^msw$/, replacement: resolveNodeModuleDir("msw") },
    // Subpaths must precede the bare package name (longest match wins).
    {
      find: "@wedding-hall/shared/types",
      replacement: path.join(SHARED_SRC, "types.ts"),
    },
    {
      find: "@wedding-hall/shared/venue-pricing",
      replacement: path.join(SHARED_SRC, "venue-pricing.ts"),
    },
    {
      find: "@wedding-hall/shared/budget-catalog",
      replacement: path.join(SHARED_SRC, "budget-catalog.ts"),
    },
    {
      find: "@wedding-hall/shared/budget-selections",
      replacement: path.join(SHARED_SRC, "budget-selections.ts"),
    },
    { find: /^@wedding-hall\/shared$/, replacement: path.join(SHARED_SRC, "index.ts") },
    { find: "@wedding-hall/shared", replacement: path.join(SHARED_SRC, "index.ts") },
    ...rest,
  ];
}

const config: StorybookConfig = {
  stories: ["../src/**/*.stories.@(ts|tsx)"],
  addons: ["@storybook/addon-essentials", "@storybook/addon-a11y"],
  framework: {
    name: "@storybook/react-vite",
    options: {},
  },
  staticDirs: ["../public"],
  viteFinal: async (userConfig) =>
    mergeConfig(userConfig, {
      // Workspace package `@wedding-hall/shared` lives outside `client/`. Without
      // this, Vite can 403 module URLs when preview (via MSW handlers) resolves
      // the shared package — the browser shows "Failed to fetch dynamically
      // imported module" for `.storybook/preview.tsx`.
      server: {
        ...userConfig.server,
        fs: {
          ...userConfig.server?.fs,
          allow: [
            path.resolve(__dirname, ".."),
            path.resolve(__dirname, "../.."),
            SHARED_SRC,
            path.resolve(__dirname, "../../node_modules"),
            path.resolve(__dirname, "../node_modules"),
            ...(userConfig.server?.fs?.allow ?? []),
          ],
        },
      },
      resolve: {
        ...userConfig.resolve,
        alias: mergeSupabaseStorybookAlias(userConfig.resolve?.alias),
      },
      optimizeDeps: {
        ...userConfig.optimizeDeps,
        include: [
          ...(userConfig.optimizeDeps?.include ?? []),
          "msw-storybook-addon",
          "msw",
        ],
      },
      define: {
        ...userConfig.define,
        "import.meta.env.VITE_SERVER_URL": JSON.stringify(
          viteEnv("VITE_SERVER_URL", "http://localhost:3001"),
        ),
        "import.meta.env.VITE_SUPABASE_URL": JSON.stringify(
          viteEnv("VITE_SUPABASE_URL", "http://localhost:54321"),
        ),
        "import.meta.env.VITE_SUPABASE_ANON_KEY": JSON.stringify(
          viteEnv("VITE_SUPABASE_ANON_KEY", FALLBACK_LOCAL_VITE_SUPABASE_ANON),
        ),
      },
    }),
};

export default config;
