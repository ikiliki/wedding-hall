// Single source of truth for venue tier prices. Imported by both:
//   - `client/src/shared/lib/venue-pricing.ts` (re-exports for UI)
//   - `server/src/lib/budget.ts`               (validates writes server-side)
// Per RULES.md: do not duplicate these numbers anywhere else.

import type { VenuePriceType } from "./types";

export const VENUE_PRICES: Record<
  Exclude<VenuePriceType, "custom">,
  number
> = {
  cheap: 250,
  average: 400,
  premium: 650,
};

export const VENUE_TIERS: ReadonlyArray<{
  id: VenuePriceType;
  label: string;
  description: string;
  pricePerGuest: number | null;
}> = [
  {
    id: "cheap",
    label: "בסיסי",
    description: "₪250 לאורח",
    pricePerGuest: VENUE_PRICES.cheap,
  },
  {
    id: "average",
    label: "ממוצע",
    description: "₪400 לאורח",
    pricePerGuest: VENUE_PRICES.average,
  },
  {
    id: "premium",
    label: "פרימיום",
    description: "₪650 לאורח",
    pricePerGuest: VENUE_PRICES.premium,
  },
  {
    id: "custom",
    label: "מותאם אישית",
    description: "הזינו מחיר משלכם",
    pricePerGuest: null,
  },
];

export function formatILS(amount: number): string {
  return `₪${amount.toLocaleString("he-IL")}`;
}

// Resolve effective price-per-guest for a tier choice. Custom requires a
// positive number; everything else looks up the table.
export function resolvePricePerGuest(
  type: VenuePriceType,
  customPricePerGuest?: number,
): number {
  if (type === "custom") {
    return Math.max(0, Math.floor(customPricePerGuest ?? 0));
  }
  return VENUE_PRICES[type];
}
