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
    label: "Cheap",
    description: "₪250 per guest",
    pricePerGuest: VENUE_PRICES.cheap,
  },
  {
    id: "average",
    label: "Average",
    description: "₪400 per guest",
    pricePerGuest: VENUE_PRICES.average,
  },
  {
    id: "premium",
    label: "Premium",
    description: "₪650 per guest",
    pricePerGuest: VENUE_PRICES.premium,
  },
  {
    id: "custom",
    label: "Custom",
    description: "Enter your own price",
    pricePerGuest: null,
  },
];

export function formatILS(amount: number): string {
  return `₪${amount.toLocaleString("en-US")}`;
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
