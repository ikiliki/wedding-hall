import type { VenuePriceType } from "@/shared/lib/types";

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
