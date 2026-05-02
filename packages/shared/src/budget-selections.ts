// What the wizard stores in `wedding_budgets.selections` (JSONB).
// One union per question template. The server recomputes totals from
// these + the catalog so prices cannot be tampered with from the browser.

import type { CategoryDef, CategoryId } from "./budget-catalog";
import { ALL_CATEGORIES, getCategory } from "./budget-catalog";

export type TierSelection = {
  kind: "tier";
  optionId: string;
  // Only set when the chosen option is `custom: true`.
  customPrice?: number;
  // Only used by the venue category (the user can name the place).
  customLabel?: string;
};

export type YesNoSelection = {
  kind: "yes_no";
  optionId: "yes" | "no";
};

export type MultiSelectSelection = {
  kind: "multi_select";
  itemIds: string[];
};

export type MultiTierSelection = {
  kind: "multi_tier";
  groupId: string;
  optionId: string;
  customPrice?: number;
};

export type SkipSelection = { kind: "skip" };

export type CategorySelection =
  | TierSelection
  | YesNoSelection
  | MultiSelectSelection
  | MultiTierSelection
  | SkipSelection;

export type BudgetSelections = {
  // Map of categoryId -> selection. Missing keys mean "not answered yet".
  selections: Partial<Record<CategoryId, CategorySelection>>;
  // Real / actual prices the couple fills in later (right column on the
  // final budget screen). Same shape as estimated lines.
  actuals?: Partial<Record<string, number>>;
  // Wedding type subtype (hall / outdoor / unique). Phase 1 = hall only.
  weddingTypeKind?: "hall" | "outdoor" | "unique";
  // Whether the user opted to continue past the post-hall gate.
  continuedExtended?: boolean;
};

// =====================================================================
// Pricing — pure functions used by both client (preview totals)
// and server (authoritative recompute on save).
// =====================================================================

export type CategoryLine = {
  categoryId: CategoryId;
  label: string;
  amount: number;
};

export type BudgetTotals = {
  lines: CategoryLine[];
  total: number;
};

// Resolve a single category's contribution.
export function resolveCategoryAmount(
  category: CategoryDef,
  selection: CategorySelection | undefined,
  ctx: { guestCount: number; venueAmount: number },
): number {
  if (!selection) return 0;
  if (selection.kind === "skip") return 0;

  if (selection.kind === "tier") {
    const tier = category.tiers?.find((t) => t.id === selection.optionId);
    if (!tier) return 0;
    if (tier.skip) return 0;
    if (tier.custom) {
      const price = Math.max(0, Math.floor(selection.customPrice ?? 0));
      // For tier-custom on per-guest categories, treat as per-guest if the
      // tier originally had a per-guest price field.
      if (category.id === "venue") return price * ctx.guestCount;
      return price;
    }
    if (typeof tier.pricePerGuest === "number") {
      return tier.pricePerGuest * ctx.guestCount;
    }
    return tier.flatPrice ?? 0;
  }

  if (selection.kind === "yes_no") {
    if (selection.optionId === "no") return 0;
    if (category.upliftPctOfVenue) {
      return Math.round((ctx.venueAmount * category.upliftPctOfVenue) / 100);
    }
    return 0;
  }

  if (selection.kind === "multi_select") {
    const items = category.items ?? [];
    return selection.itemIds.reduce((sum, id) => {
      const item = items.find((i) => i.id === id);
      return sum + (item?.flatPrice ?? 0);
    }, 0);
  }

  if (selection.kind === "multi_tier") {
    const group = category.groups?.find((g) => g.id === selection.groupId);
    const opt = group?.options.find((o) => o.id === selection.optionId);
    if (!opt) return 0;
    if (opt.skip) return 0;
    if (opt.custom) return Math.max(0, Math.floor(selection.customPrice ?? 0));
    return opt.flatPrice ?? 0;
  }

  return 0;
}

export function computeBudgetTotals(
  selections: BudgetSelections["selections"],
  guestCount: number,
): BudgetTotals {
  const lines: CategoryLine[] = [];

  // Venue is computed first so the food-upgrade percentage has a base.
  const venueDef = getCategory("venue");
  const venueAmount = venueDef
    ? resolveCategoryAmount(venueDef, selections.venue, {
        guestCount,
        venueAmount: 0,
      })
    : 0;

  for (const category of ALL_CATEGORIES) {
    const amount =
      category.id === "venue"
        ? venueAmount
        : resolveCategoryAmount(category, selections[category.id], {
            guestCount,
            venueAmount,
          });
    if (amount <= 0 && !selections[category.id]) continue;
    lines.push({ categoryId: category.id, label: category.title, amount });
  }

  const total = lines.reduce((s, l) => s + l.amount, 0);
  return { lines, total };
}
