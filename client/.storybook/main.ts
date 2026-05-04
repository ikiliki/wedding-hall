import type { StorybookConfig } from "@storybook/react-vite";
import path from "node:path";
import { mergeConfig, type AliasOptions } from "vite";

const SUPABASE_MOCK = path.resolve(
  __dirname,
  "../src/storybook/mocks/supabase-client.ts",
);

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
