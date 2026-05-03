// Single source of truth for the multi-step wedding-budget catalog.
//
// The client renders the wizard from this config (no per-step code), and
// the server uses the same prices to recompute totals server-side so the
// browser cannot lie about money.
//
// Currency is ILS (₪). All numbers are integers in shekels.
// Display copy is Hebrew (RTL UI).

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
    title: "אולם",
    subtitle: "לפי אורח — כולל הכל.",
    info:
      "הערות חשובות לחוזה — מה כלול ומה בתוספת (אוכל, עיצוב, תאורה וכו'). " +
      "תמיד כדאי לקרוא את החוזה פעמיים.",
    template: "tier",
    tiers: [
      {
        id: "cheap",
        label: "בסיסי",
        pricePerGuest: 250,
        hint: "₪200–300 לאורח",
      },
      {
        id: "average",
        label: "ממוצע",
        pricePerGuest: 400,
        hint: "₪350–450 לאורח",
      },
      {
        id: "premium",
        label: "פרימיום",
        pricePerGuest: 650,
        hint: "₪550–750 לאורח",
      },
      {
        id: "custom",
        label: "כבר סגרנו מחיר",
        pricePerGuest: null,
        custom: true,
        hint: "הזינו את המחיר שסגרתם",
      },
    ],
  },
  {
    id: "food_upgrade",
    order: 2,
    flow: "hall",
    title: "שדרוג תפריט",
    subtitle: "מעבר לתפריט הסטנדרטי של האולם.",
    template: "yes_no",
    upliftPctOfVenue: 3,
    tiers: [
      { id: "yes", label: "כן — רוצים לשדרג", hint: "+3% על סכום האולם" },
      { id: "no", label: "לא, נשארים בסטנדרט", hint: "₪0" },
    ],
  },
  {
    id: "bar",
    order: 3,
    flow: "hall",
    title: "בר",
    info:
      "חלק מהאולמות כוללים משקאות וחלק לא — חשוב לבדוק בחוזה. " +
      "בר של אולם לעיתים כרוך בערך ~₪22 לאורח.",
    template: "tier",
    tiers: [
      {
        id: "external",
        label: "מביאים משקאות משלנו",
        flatPrice: 5000,
        hint: "אלכוהול חיצוני, בערך ₪5,000 סה״כ",
      },
      {
        id: "venue",
        label: "בר של האולם",
        flatPrice: 0,
        hint: "כלול במחיר האולם",
      },
      {
        id: "premium",
        label: "שדרוג פרימיום",
        flatPrice: 8000,
        hint: "משקאות משודרגים ויותר אפשרויות",
      },
      {
        id: "deluxe",
        label: "שדרוג דלוקס",
        flatPrice: 15000,
        hint: "קוקטיילים חתומים ובר עליתוני",
      },
      {
        id: "custom",
        label: "כבר סגרנו מחיר",
        flatPrice: null,
        custom: true,
      },
    ],
  },
  {
    id: "dj",
    order: 4,
    flow: "hall",
    title: "די ג׳יי",
    template: "tier",
    tiers: [
      { id: "cheap", label: "כלכלי", flatPrice: 4500 },
      { id: "average", label: "בינוני", flatPrice: 8500 },
      { id: "premium", label: "יקר יותר", flatPrice: 15000 },
      { id: "custom", label: "כבר סגרנו", flatPrice: null, custom: true },
    ],
  },
  {
    id: "photo",
    order: 5,
    flow: "hall",
    title: "צילום וידאו",
    skippable: true,
    template: "tier",
    tiers: [
      { id: "cheap", label: "כלכלי", flatPrice: 7000 },
      { id: "average", label: "בינוני", flatPrice: 12000 },
      { id: "premium", label: "יקר יותר", flatPrice: 22000 },
      { id: "custom", label: "כבר סגרנו", flatPrice: null, custom: true },
      { id: "skip", label: "בלי צלמים", flatPrice: 0, skip: true },
    ],
  },
  {
    id: "flowers",
    order: 6,
    flow: "hall",
    title: "פרחים ועיצוב",
    info:
      "שני מסלולים: חבילת עיצוב דרך האולם (נוח ומרוכז) או ספק חיצוני " +
      "(יותר גמיש, לעיתים יקר יותר).",
    template: "multi_tier",
    skippable: true,
    groups: [
      {
        id: "venue",
        label: "דרך האולם",
        options: [
          { id: "venue_10", label: "שדרוג קל", flatPrice: 10000 },
          { id: "venue_20", label: "שדרוג מלא", flatPrice: 20000 },
          { id: "venue_30", label: "פס קול", flatPrice: 30000 },
        ],
      },
      {
        id: "external",
        label: "ספק חיצוני",
        options: [
          { id: "ext_10", label: "מינימליסטי", flatPrice: 10000 },
          { id: "ext_30", label: "שופע", flatPrice: 30000 },
          { id: "ext_60", label: "אדיטוריאלי", flatPrice: 60000 },
        ],
      },
      {
        id: "other",
        label: "אחר",
        options: [
          { id: "skip", label: "בלי שדרוג", flatPrice: 0, skip: true },
          { id: "custom", label: "כבר סגרנו", flatPrice: null, custom: true },
        ],
      },
    ],
  },
  {
    id: "planner",
    order: 7,
    flow: "hall",
    title: "מתכננת חתונות",
    skippable: true,
    template: "tier",
    tiers: [
      { id: "cheap", label: "כלכלי", flatPrice: 8000 },
      { id: "average", label: "בינוני", flatPrice: 18000 },
      { id: "premium", label: "פרימיום", flatPrice: 35000 },
      { id: "custom", label: "כבר סגרנו", flatPrice: null, custom: true },
      { id: "skip", label: "בלי מתכננת", flatPrice: 0, skip: true },
    ],
  },
  {
    id: "addons",
    order: 8,
    flow: "hall",
    title: "תוספות",
    subtitle: "בוחרים מה שמתאים — מחירים קבועים, בלי דרגות.",
    template: "multi_select",
    skippable: true,
    items: [
      { id: "photo_booth", label: "צילום מגנטים / פוטובוט", flatPrice: 3500 },
      { id: "guest_gifts", label: "מתנות לאורחים", flatPrice: 4000 },
      { id: "candy_bar", label: "בר ממתקים", flatPrice: 2500 },
      { id: "flip_flops", label: "כפכפים למכירה", flatPrice: 1500 },
      { id: "kippahs", label: "כיפות ממותגות", flatPrice: 1200 },
      {
        id: "bathroom_kits",
        label: "ערכות לשירותים",
        flatPrice: 800,
        hint: "מסטיק, עזרה ראשונה, בשמים",
      },
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
    title: "כלה — שמלה",
    template: "tier",
    skippable: true,
    tiers: [
      { id: "rental", label: "השכרה, שמלה אחת", flatPrice: 4000 },
      { id: "purchase", label: "רכישה, שמלה אחת", flatPrice: 9000 },
      {
        id: "multi",
        label: "כמה שמלות + התאמות",
        flatPrice: 22000,
      },
      {
        id: "custom",
        label: "כבר יודעים את המחיר",
        flatPrice: null,
        custom: true,
      },
      { id: "skip", label: "דילוג", flatPrice: 0, skip: true },
    ],
  },
  {
    id: "groom",
    order: 11,
    flow: "extended",
    title: "חתן — לבוש",
    template: "tier",
    skippable: true,
    tiers: [
      { id: "cheap", label: "כלכלי", flatPrice: 1500 },
      { id: "average", label: "בינוני", flatPrice: 3500 },
      { id: "premium", label: "פרימיום", flatPrice: 7500 },
      { id: "custom", label: "מחיר מותאם", flatPrice: null, custom: true },
      { id: "skip", label: "דילוג", flatPrice: 0, skip: true },
    ],
  },
  {
    id: "villa",
    order: 12,
    flow: "extended",
    title: "וילה לצילומים",
    skippable: true,
    template: "tier",
    tiers: [
      { id: "skip", label: "לא נדרש", flatPrice: 0, skip: true },
      { id: "cheap", label: "כלכלי, לילה אחד", flatPrice: 2500 },
      { id: "average", label: "בינוני", flatPrice: 5000 },
      {
        id: "premium",
        label: "יקר יותר",
        flatPrice: 9000,
        hint: "תלוי מיקום",
      },
      { id: "custom", label: "מחיר מותאם", flatPrice: null, custom: true },
    ],
  },
  {
    id: "transport",
    order: 13,
    flow: "extended",
    title: "הסעות אורחים",
    skippable: true,
    template: "tier",
    tiers: [
      { id: "skip", label: "לא נדרש", flatPrice: 0, skip: true },
      { id: "small", label: "אוטובוס אחד (~50 אורחים)", flatPrice: 3500 },
      { id: "medium", label: "שני אוטובוסים (~100 אורחים)", flatPrice: 6500 },
      { id: "large", label: "שלושה אוטובוסים ומעלה", flatPrice: 10000 },
      { id: "custom", label: "מחיר מותאם", flatPrice: null, custom: true },
    ],
  },
  {
    id: "car_rental",
    order: 14,
    flow: "extended",
    title: "השכרת רכב",
    skippable: true,
    template: "tier",
    tiers: [
      { id: "skip", label: "לא נדרש", flatPrice: 0, skip: true },
      { id: "cheap", label: "סטנדרט", flatPrice: 600 },
      { id: "average", label: "פרימיום", flatPrice: 1500 },
      { id: "premium", label: "יוקרה", flatPrice: 3500 },
      { id: "custom", label: "מחיר מותאם", flatPrice: null, custom: true },
    ],
  },
  {
    id: "makeup",
    order: 15,
    flow: "extended",
    title: "איפור ושיער",
    skippable: true,
    template: "tier",
    tiers: [
      { id: "cheap", label: "כלכלי", flatPrice: 1500 },
      { id: "average", label: "בינוני", flatPrice: 3000 },
      { id: "premium", label: "פרימיום", flatPrice: 6000 },
      { id: "custom", label: "מחיר מותאם", flatPrice: null, custom: true },
      { id: "skip", label: "דילוג", flatPrice: 0, skip: true },
    ],
  },
  {
    id: "hidden_costs",
    order: 16,
    flow: "extended",
    title: "עלויות נסתרות",
    subtitle: "דברים שרבים שוכחים. סמנו מה רלוונטי אליכם.",
    template: "multi_select",
    skippable: true,
    items: [
      { id: "tips", label: "טיפים לספקים", flatPrice: 3000 },
      {
        id: "stationery",
        label: "סידורי ישיבה והזמנות",
        flatPrice: 2000,
      },
      { id: "villa_food", label: "אוכל ושתייה בוילה", flatPrice: 1500 },
      { id: "misc", label: "הוצאות ברגע האחרון", flatPrice: 2000 },
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
