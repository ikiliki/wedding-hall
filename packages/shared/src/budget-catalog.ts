// Single source of truth for the multi-step wedding-budget catalog.
//
// The client renders the wizard from this config (no per-step code), and
// the server uses the same prices to recompute totals server-side so the
// browser cannot lie about money.
//
// Currency is ILS (₪). All numbers are integers in shekels.

export type CategoryId =
  | "venue"
  | "food_upgrade"
  | "bar"
  | "dj"
  | "photo"
  | "flowers"
  | "planner"
  | "addons"
  | "bride"
  | "groom"
  | "villa"
  | "transport"
  | "car_rental"
  | "makeup"
  | "hidden_costs";

// One of the 4 universal templates plus a few category-specific shapes.
export type OptionTemplate =
  | "tier"          // cheap / average / premium / custom
  | "yes_no"        // bar/food upgrade-style binary
  | "multi_select"  // add-ons checklist with fixed prices
  | "multi_tier"    // venue-internal vs external-vendor tier groups (flowers)
  | "skip";

export type TierKind = "cheap" | "average" | "premium" | "deluxe" | "custom";

export type TierOption = {
  id: TierKind | string;
  label: string;
  // Either a flat price, a per-guest price, or a fixed range.
  // `null` means "user enters their own price".
  pricePerGuest?: number | null;
  flatPrice?: number | null;
  // Show as a "soft" option (e.g. "We already booked it" — custom path).
  custom?: boolean;
  // Show as a "skip" option (no money, just records the choice).
  skip?: boolean;
  // Optional helper text under the label.
  hint?: string;
};

export type TierGroup = {
  id: string;
  label: string;
  options: TierOption[];
};

export type CategoryDef = {
  id: CategoryId;
  // Wizard order. Renders left-to-right in the progress bar.
  order: number;
  // The "Hall" flow only includes hall-specific categories. Phase 1 ships
  // the hall flow only; outdoor/unique are stubs.
  flow: "core" | "hall" | "extended";
  // Display.
  title: string;
  subtitle?: string;
  // Optional info popover content. Plain text, rendered as paragraphs.
  info?: string;
  // Whether the user can skip this category entirely.
  skippable?: boolean;
  // Universal template + the actual options.
  template: OptionTemplate;
  // For tier / multi_tier / yes_no / multi_select.
  tiers?: TierOption[];
  groups?: TierGroup[];
  items?: TierOption[]; // multi_select: each line item has flatPrice
  // For yes_no: percentage uplift on the venue line if "yes".
  upliftPctOfVenue?: number;
};

// =====================================================================
// Wedding Venue (Hall) flow — pages 1..8 from the product spec.
// Page 9 ("Continue?") is a router decision, not a category.
// =====================================================================

export const HALL_CATEGORIES: ReadonlyArray<CategoryDef> = [
  {
    id: "venue",
    order: 1,
    flow: "hall",
    title: "Venue",
    subtitle: "Per guest, all-in.",
    info:
      "Important contract notes — what's included, what's extra (food, " +
      "design, lighting, etc.). Always read the contract twice.",
    template: "tier",
    tiers: [
      { id: "cheap", label: "Cheap", pricePerGuest: 250, hint: "₪200–300 per guest" },
      { id: "average", label: "Average", pricePerGuest: 400, hint: "₪350–450 per guest" },
      { id: "premium", label: "Premium", pricePerGuest: 650, hint: "₪550–750 per guest" },
      { id: "custom", label: "We already booked it", pricePerGuest: null, custom: true, hint: "Enter the price you locked in" },
    ],
  },
  {
    id: "food_upgrade",
    order: 2,
    flow: "hall",
    title: "Food upgrade",
    subtitle: "Bump the menu beyond standard.",
    template: "yes_no",
    upliftPctOfVenue: 3,
    tiers: [
      { id: "yes", label: "Yes — upgrade", hint: "+3% on the venue line" },
      { id: "no", label: "No, keep it standard", hint: "₪0" },
    ],
  },
  {
    id: "bar",
    order: 3,
    flow: "hall",
    title: "Bar",
    info:
      "Some venues include alcohol, some don't. Check the contract " +
      "carefully — venue bars often charge ~₪22 per guest.",
    template: "tier",
    tiers: [
      { id: "external", label: "Bring our own", flatPrice: 5000, hint: "External alcohol, ~₪5,000 total" },
      { id: "venue", label: "Use venue bar", flatPrice: 0, hint: "Included in the venue price" },
      { id: "premium", label: "Premium upgrade", flatPrice: 8000, hint: "Better spirits, more options" },
      { id: "deluxe", label: "Deluxe upgrade", flatPrice: 15000, hint: "Top shelf, signature cocktails" },
      { id: "custom", label: "We already agreed a price", flatPrice: null, custom: true },
    ],
  },
  {
    id: "dj",
    order: 4,
    flow: "hall",
    title: "DJ",
    template: "tier",
    tiers: [
      { id: "cheap", label: "Cheap", flatPrice: 4500 },
      { id: "average", label: "Medium", flatPrice: 8500 },
      { id: "premium", label: "Expensive", flatPrice: 15000 },
      { id: "custom", label: "We already booked", flatPrice: null, custom: true },
    ],
  },
  {
    id: "photo",
    order: 5,
    flow: "hall",
    title: "Photo + video",
    skippable: true,
    template: "tier",
    tiers: [
      { id: "cheap", label: "Cheap", flatPrice: 7000 },
      { id: "average", label: "Medium", flatPrice: 12000 },
      { id: "premium", label: "Expensive", flatPrice: 22000 },
      { id: "custom", label: "We already booked", flatPrice: null, custom: true },
      { id: "skip", label: "No photographers", flatPrice: 0, skip: true },
    ],
  },
  {
    id: "flowers",
    order: 6,
    flow: "hall",
    title: "Flowers",
    info:
      "Two paths: in-venue design package (cheaper, all in one place) " +
      "or an external florist (more flexibility, often more $).",
    template: "multi_tier",
    skippable: true,
    groups: [
      {
        id: "venue",
        label: "Through the venue",
        options: [
          { id: "venue_10", label: "Light upgrade", flatPrice: 10000 },
          { id: "venue_20", label: "Full upgrade", flatPrice: 20000 },
          { id: "venue_30", label: "Statement", flatPrice: 30000 },
        ],
      },
      {
        id: "external",
        label: "External florist",
        options: [
          { id: "ext_10", label: "Simple", flatPrice: 10000 },
          { id: "ext_30", label: "Lush", flatPrice: 30000 },
          { id: "ext_60", label: "Editorial", flatPrice: 60000 },
        ],
      },
      {
        id: "other",
        label: "Other",
        options: [
          { id: "skip", label: "No upgrade", flatPrice: 0, skip: true },
          { id: "custom", label: "We already booked", flatPrice: null, custom: true },
        ],
      },
    ],
  },
  {
    id: "planner",
    order: 7,
    flow: "hall",
    title: "Wedding planner",
    skippable: true,
    template: "tier",
    tiers: [
      { id: "cheap", label: "Cheap", flatPrice: 8000 },
      { id: "average", label: "Medium", flatPrice: 18000 },
      { id: "premium", label: "Premium", flatPrice: 35000 },
      { id: "custom", label: "We already booked", flatPrice: null, custom: true },
      { id: "skip", label: "No planner", flatPrice: 0, skip: true },
    ],
  },
  {
    id: "addons",
    order: 8,
    flow: "hall",
    title: "Add-ons",
    subtitle: "Pick anything you'd like — fixed prices, no tiers.",
    template: "multi_select",
    skippable: true,
    items: [
      { id: "photo_booth", label: "Photo booth", flatPrice: 3500 },
      { id: "guest_gifts", label: "Guest gifts", flatPrice: 4000 },
      { id: "candy_bar", label: "Candy bar", flatPrice: 2500 },
      { id: "flip_flops", label: "Flip-flops", flatPrice: 1500 },
      { id: "kippahs", label: "Branded kippahs", flatPrice: 1200 },
      { id: "bathroom_kits", label: "Bathroom kits", flatPrice: 800, hint: "Gum, first aid, perfume" },
    ],
  },
];

// =====================================================================
// Extended categories (after the "Continue?" gate, optional).
// =====================================================================

export const EXTENDED_CATEGORIES: ReadonlyArray<CategoryDef> = [
  {
    id: "bride",
    order: 10,
    flow: "extended",
    title: "Bride — dress",
    template: "tier",
    skippable: true,
    tiers: [
      { id: "rental", label: "Rental, single dress", flatPrice: 4000 },
      { id: "purchase", label: "Purchase, single dress", flatPrice: 9000 },
      { id: "multi", label: "Multiple dresses + customization", flatPrice: 22000 },
      { id: "custom", label: "We already know the price", flatPrice: null, custom: true },
      { id: "skip", label: "Skip", flatPrice: 0, skip: true },
    ],
  },
  {
    id: "groom",
    order: 11,
    flow: "extended",
    title: "Groom — clothing",
    template: "tier",
    skippable: true,
    tiers: [
      { id: "cheap", label: "Cheap", flatPrice: 1500 },
      { id: "average", label: "Medium", flatPrice: 3500 },
      { id: "premium", label: "Premium", flatPrice: 7500 },
      { id: "custom", label: "Custom price", flatPrice: null, custom: true },
      { id: "skip", label: "Skip", flatPrice: 0, skip: true },
    ],
  },
  {
    id: "villa",
    order: 12,
    flow: "extended",
    title: "Villa for photos",
    skippable: true,
    template: "tier",
    tiers: [
      { id: "skip", label: "Not needed", flatPrice: 0, skip: true },
      { id: "cheap", label: "Cheap, one night", flatPrice: 2500 },
      { id: "average", label: "Medium", flatPrice: 5000 },
      { id: "premium", label: "Expensive", flatPrice: 9000, hint: "Location-based" },
      { id: "custom", label: "Custom price", flatPrice: null, custom: true },
    ],
  },
  {
    id: "transport",
    order: 13,
    flow: "extended",
    title: "Guest transportation",
    skippable: true,
    template: "tier",
    tiers: [
      { id: "skip", label: "Not needed", flatPrice: 0, skip: true },
      { id: "small", label: "1 bus (~50 guests)", flatPrice: 3500 },
      { id: "medium", label: "2 buses (~100 guests)", flatPrice: 6500 },
      { id: "large", label: "3+ buses", flatPrice: 10000 },
      { id: "custom", label: "Custom price", flatPrice: null, custom: true },
    ],
  },
  {
    id: "car_rental",
    order: 14,
    flow: "extended",
    title: "Car rental",
    skippable: true,
    template: "tier",
    tiers: [
      { id: "skip", label: "Not needed", flatPrice: 0, skip: true },
      { id: "cheap", label: "Standard", flatPrice: 600 },
      { id: "average", label: "Premium", flatPrice: 1500 },
      { id: "premium", label: "Luxury", flatPrice: 3500 },
      { id: "custom", label: "Custom price", flatPrice: null, custom: true },
    ],
  },
  {
    id: "makeup",
    order: 15,
    flow: "extended",
    title: "Makeup artist",
    skippable: true,
    template: "tier",
    tiers: [
      { id: "cheap", label: "Cheap", flatPrice: 1500 },
      { id: "average", label: "Medium", flatPrice: 3000 },
      { id: "premium", label: "Premium", flatPrice: 6000 },
      { id: "custom", label: "Custom price", flatPrice: null, custom: true },
      { id: "skip", label: "Skip", flatPrice: 0, skip: true },
    ],
  },
  {
    id: "hidden_costs",
    order: 16,
    flow: "extended",
    title: "Hidden costs checklist",
    subtitle: "Things people forget. Toggle what applies to you.",
    template: "multi_select",
    skippable: true,
    items: [
      { id: "tips", label: "Vendor tips", flatPrice: 3000 },
      { id: "stationery", label: "Seating chart + invitations", flatPrice: 2000 },
      { id: "villa_food", label: "Villa food & drinks", flatPrice: 1500 },
      { id: "misc", label: "Misc. last-minute", flatPrice: 2000 },
    ],
  },
];

export const ALL_CATEGORIES: ReadonlyArray<CategoryDef> = [
  ...HALL_CATEGORIES,
  ...EXTENDED_CATEGORIES,
];

export function getCategory(id: CategoryId): CategoryDef | undefined {
  return ALL_CATEGORIES.find((c) => c.id === id);
}
