/**
 * Fixtures for Storybook only. Not used by the production app bundle.
 */

import type { BudgetSelections, WeddingBudget } from "@wedding-hall/shared";
import { computeBudgetTotals } from "@wedding-hall/shared";

const STORY_SELECTIONS = {
  venue: { kind: "tier" as const, optionId: "average" as const },
  food_upgrade: { kind: "yes_no" as const, optionId: "yes" as const },
  bar: { kind: "tier" as const, optionId: "venue" as const },
  dj: { kind: "tier" as const, optionId: "average" as const },
  photo: { kind: "skip" as const },
  flowers: { kind: "skip" as const },
  planner: { kind: "skip" as const },
  addons: { kind: "skip" as const },
} satisfies BudgetSelections["selections"];

export const MOCK_BUDGET_SELECTIONS: BudgetSelections = {
  selections: STORY_SELECTIONS,
  weddingTypeKind: "hall",
  continuedExtended: false,
  actuals: { dj: 5000 },
};

const guestCount = 200;
const totals = computeBudgetTotals(MOCK_BUDGET_SELECTIONS.selections ?? {}, guestCount);

export const MOCK_WEDDING_BUDGET: WeddingBudget = {
  id: "storybook-budget-1",
  user_id: "11111111-1111-1111-1111-111111111111",
  couple_name_1: "נועה",
  couple_name_2: "גיא",
  preferred_day: "thu",
  guest_count: guestCount,
  guest_count_min: 100,
  guest_count_max: 300,
  wedding_type: "hall",
  venue_price_type: "average",
  venue_price_per_guest: 400,
  venue_name: "אולם דמו",
  estimated_total: totals.total || 275_000,
  selections: MOCK_BUDGET_SELECTIONS,
  wedding_date: "2026-09-12",
  created_at: "2026-01-01T00:00:00.000Z",
  updated_at: "2026-01-01T00:00:00.000Z",
};

export const MOCK_EMPTY_BUDGET: WeddingBudget = {
  ...MOCK_WEDDING_BUDGET,
  selections: {
    selections: {},
    weddingTypeKind: "hall",
    continuedExtended: false,
  },
  estimated_total: 0,
};
