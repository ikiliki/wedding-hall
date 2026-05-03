import type { Profile, UpsertProfilePayload } from "@wedding-hall/shared";
import type { WeddingBudget } from "@wedding-hall/shared";
import { http, HttpResponse } from "msw";
import {
  MOCK_WEDDING_BUDGET,
} from "@/storybook/fixtures/mock-budget";

/** Must match `.storybook/main.ts` `import.meta.env.VITE_SERVER_URL` define. */
export const STORYBOOK_SERVER_ORIGIN = "http://localhost:3001";

export function buildMockProfile(
  payload?: UpsertProfilePayload,
  isAdmin = false,
): Profile {
  return {
    id: MOCK_WEDDING_BUDGET.user_id,
    email:
      typeof payload?.email === "string" ? payload.email : "storybook@example.com",
    full_name:
      typeof payload?.full_name === "string"
        ? payload.full_name
        : "Story Couple",
    is_admin: isAdmin,
    created_at: MOCK_WEDDING_BUDGET.created_at,
    updated_at: MOCK_WEDDING_BUDGET.updated_at,
  };
}

let budgetState: WeddingBudget = structuredClone(MOCK_WEDDING_BUDGET);

function budgetGet() {
  return http.get(`${STORYBOOK_SERVER_ORIGIN}/api/budget`, () =>
    HttpResponse.json({ budget: structuredClone(budgetState) }),
  );
}

function budgetPut() {
  return http.put(
    `${STORYBOOK_SERVER_ORIGIN}/api/budget`,
    async ({ request }: { request: Request }) => {
      await request.text();
      return HttpResponse.json({ budget: structuredClone(budgetState) });
    },
  );
}

function postProfiles(isAdminProfile: boolean) {
  return http.post(
    `${STORYBOOK_SERVER_ORIGIN}/api/profiles`,
    async ({ request }: { request: Request }) => {
      let payload: UpsertProfilePayload | undefined;
      try {
        payload = (await request.json()) as UpsertProfilePayload;
      } catch {
        payload = undefined;
      }
      return HttpResponse.json({
        profile: buildMockProfile(payload, isAdminProfile),
      });
    },
  );
}

export function buildCoreHandlers(isAdminProfile = false) {
  return [budgetGet(), budgetPut(), postProfiles(isAdminProfile)];
}

export function handlersWithBudget(
  budget: WeddingBudget,
  isAdminProfile = false,
) {
  budgetState = structuredClone(budget);
  return buildCoreHandlers(isAdminProfile);
}

/** Used by `.storybook/preview.tsx` */
export const defaultHandlers = handlersWithBudget(MOCK_WEDDING_BUDGET, false);

export function adminHandlers() {
  return handlersWithBudget(MOCK_WEDDING_BUDGET, true);
}
