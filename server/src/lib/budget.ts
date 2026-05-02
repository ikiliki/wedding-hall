// Validation + normalisation for budget writes.
// Lives on the server so business rules cannot be skipped from the browser.
//
// We accept the legacy onboarding shape (couple/day/guests/venue tier) AND
// an optional `selections` blob (the new multi-step wizard). The server
// recomputes `estimated_total` from the catalog so the client cannot lie
// about prices.

import {
  ALL_CATEGORIES,
  computeBudgetTotals,
  resolvePricePerGuest,
  type BudgetSelections,
  type CategorySelection,
  type SaveBudgetPayload,
  type WeddingType,
  type VenuePriceType,
} from "@wedding-hall/shared";

export type ValidatedBudget = {
  user_id: string;
  couple_name_1: string;
  couple_name_2: string;
  preferred_day: string | null;
  guest_count: number;
  guest_count_min: number | null;
  guest_count_max: number | null;
  wedding_type: WeddingType;
  venue_price_type: VenuePriceType;
  venue_price_per_guest: number;
  venue_name: string | null;
  estimated_total: number;
  selections: BudgetSelections | null;
};

const VENUE_PRICE_TYPES: ReadonlyArray<VenuePriceType> = [
  "cheap",
  "average",
  "premium",
  "custom",
];

export type ValidationError = { field: string; message: string };

function clampInt(n: unknown): number | null {
  if (typeof n !== "number" || !Number.isFinite(n)) return null;
  return Math.max(0, Math.floor(n));
}

// Accept only the union shapes we know about. Anything else is silently
// dropped so a malicious client cannot persist arbitrary JSON.
function sanitizeSelection(value: unknown): CategorySelection | null {
  if (!value || typeof value !== "object") return null;
  const v = value as { kind?: unknown };
  switch (v.kind) {
    case "tier": {
      const o = value as {
        kind: "tier";
        optionId?: unknown;
        customPrice?: unknown;
        customLabel?: unknown;
      };
      if (typeof o.optionId !== "string") return null;
      const out: CategorySelection = { kind: "tier", optionId: o.optionId };
      if (typeof o.customPrice === "number" && Number.isFinite(o.customPrice)) {
        out.customPrice = Math.max(0, Math.floor(o.customPrice));
      }
      if (typeof o.customLabel === "string" && o.customLabel.trim()) {
        out.customLabel = o.customLabel.trim().slice(0, 200);
      }
      return out;
    }
    case "yes_no": {
      const o = value as { optionId?: unknown };
      if (o.optionId !== "yes" && o.optionId !== "no") return null;
      return { kind: "yes_no", optionId: o.optionId };
    }
    case "multi_select": {
      const o = value as { itemIds?: unknown };
      if (!Array.isArray(o.itemIds)) return null;
      const itemIds = o.itemIds.filter(
        (x): x is string => typeof x === "string",
      );
      return { kind: "multi_select", itemIds };
    }
    case "multi_tier": {
      const o = value as {
        groupId?: unknown;
        optionId?: unknown;
        customPrice?: unknown;
      };
      if (typeof o.groupId !== "string" || typeof o.optionId !== "string") {
        return null;
      }
      const out: CategorySelection = {
        kind: "multi_tier",
        groupId: o.groupId,
        optionId: o.optionId,
      };
      if (typeof o.customPrice === "number" && Number.isFinite(o.customPrice)) {
        out.customPrice = Math.max(0, Math.floor(o.customPrice));
      }
      return out;
    }
    case "skip":
      return { kind: "skip" };
    default:
      return null;
  }
}

function sanitizeSelections(input: unknown): BudgetSelections | null {
  if (!input || typeof input !== "object") return null;
  const raw = input as Partial<BudgetSelections>;
  const allowedIds = new Set(ALL_CATEGORIES.map((c) => c.id));
  const out: BudgetSelections = { selections: {} };

  if (raw.selections && typeof raw.selections === "object") {
    for (const [key, value] of Object.entries(raw.selections)) {
      if (!allowedIds.has(key as never)) continue;
      const cleaned = sanitizeSelection(value);
      if (cleaned) {
        // narrow: key was confirmed in allowedIds
        (out.selections as Record<string, CategorySelection>)[key] = cleaned;
      }
    }
  }
  if (raw.actuals && typeof raw.actuals === "object") {
    const actuals: Record<string, number> = {};
    for (const [key, value] of Object.entries(raw.actuals)) {
      if (typeof value === "number" && Number.isFinite(value)) {
        actuals[key.slice(0, 64)] = Math.max(0, Math.floor(value));
      }
    }
    if (Object.keys(actuals).length) out.actuals = actuals;
  }
  if (
    raw.weddingTypeKind === "hall" ||
    raw.weddingTypeKind === "outdoor" ||
    raw.weddingTypeKind === "unique"
  ) {
    out.weddingTypeKind = raw.weddingTypeKind;
  }
  if (typeof raw.continuedExtended === "boolean") {
    out.continuedExtended = raw.continuedExtended;
  }
  return out;
}

export function validateBudgetPayload(
  body: unknown,
  userId: string,
): { ok: true; value: ValidatedBudget } | { ok: false; errors: ValidationError[] } {
  if (!body || typeof body !== "object") {
    return {
      ok: false,
      errors: [{ field: "body", message: "Expected a JSON object." }],
    };
  }
  const raw = body as Partial<SaveBudgetPayload>;
  const errors: ValidationError[] = [];

  const coupleName1 = typeof raw.coupleName1 === "string" ? raw.coupleName1.trim() : "";
  const coupleName2 = typeof raw.coupleName2 === "string" ? raw.coupleName2.trim() : "";
  if (!coupleName1) errors.push({ field: "coupleName1", message: "Required." });
  if (!coupleName2) errors.push({ field: "coupleName2", message: "Required." });

  const preferredDay =
    typeof raw.preferredDay === "string" && raw.preferredDay.trim()
      ? raw.preferredDay.trim()
      : null;

  const guestCount = clampInt(raw.guestCount);
  if (guestCount === null) {
    errors.push({ field: "guestCount", message: "Must be a number." });
  }
  const guestCountMin = clampInt(raw.guestCountMin);
  const guestCountMax = clampInt(raw.guestCountMax);

  if (raw.weddingType !== "hall") {
    errors.push({ field: "weddingType", message: "Only 'hall' is supported in Phase 1." });
  }
  const weddingType: WeddingType = "hall";

  if (!raw.venuePriceType || !VENUE_PRICE_TYPES.includes(raw.venuePriceType)) {
    errors.push({
      field: "venuePriceType",
      message: `Must be one of ${VENUE_PRICE_TYPES.join(", ")}.`,
    });
  }

  let venuePricePerGuest = 0;
  if (raw.venuePriceType === "custom") {
    if (
      typeof raw.customPricePerGuest !== "number" ||
      !Number.isFinite(raw.customPricePerGuest) ||
      raw.customPricePerGuest <= 0
    ) {
      errors.push({
        field: "customPricePerGuest",
        message: "Required (positive number) when venuePriceType is 'custom'.",
      });
    } else {
      venuePricePerGuest = resolvePricePerGuest(
        "custom",
        raw.customPricePerGuest,
      );
    }
  } else if (
    raw.venuePriceType &&
    VENUE_PRICE_TYPES.includes(raw.venuePriceType)
  ) {
    venuePricePerGuest = resolvePricePerGuest(raw.venuePriceType);
  }

  const venueName =
    raw.venuePriceType === "custom" &&
    typeof raw.venueName === "string" &&
    raw.venueName.trim()
      ? raw.venueName.trim()
      : null;

  const selections = sanitizeSelections(raw.selections);

  if (errors.length > 0 || guestCount === null) {
    return { ok: false, errors };
  }

  // Server-authoritative total. If the client sent a selections blob,
  // recompute from the catalog. Otherwise fall back to the legacy
  // venue-only formula so the old onboarding still works.
  const venueLineFromTier = guestCount * venuePricePerGuest;
  let estimated_total = venueLineFromTier;
  if (selections) {
    const totals = computeBudgetTotals(selections.selections, guestCount);
    estimated_total = totals.total;
    // If the wizard never asked the venue tier question, keep the legacy
    // venue line so the dashboard still has a sensible base.
    if (estimated_total === 0) estimated_total = venueLineFromTier;
  }

  return {
    ok: true,
    value: {
      user_id: userId,
      couple_name_1: coupleName1,
      couple_name_2: coupleName2,
      preferred_day: preferredDay,
      guest_count: guestCount,
      guest_count_min: guestCountMin,
      guest_count_max: guestCountMax,
      wedding_type: weddingType,
      venue_price_type: raw.venuePriceType as VenuePriceType,
      venue_price_per_guest: venuePricePerGuest,
      venue_name: venueName,
      estimated_total,
      selections,
    },
  };
}
