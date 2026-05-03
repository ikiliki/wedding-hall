import type { SaveBudgetPayload, WeddingBudget } from "@wedding-hall/shared";

/** Build a PUT body from the latest server row (e.g. dashboard edits). */
export function weddingBudgetToSavePayload(
  b: WeddingBudget,
  overrides: Partial<SaveBudgetPayload> = {},
): SaveBudgetPayload {
  const base: SaveBudgetPayload = {
    coupleName1: b.couple_name_1,
    coupleName2: b.couple_name_2,
    preferredDay: b.preferred_day ?? "",
    guestCount: b.guest_count,
    guestCountMin: b.guest_count_min ?? undefined,
    guestCountMax: b.guest_count_max ?? undefined,
    weddingType: "hall",
    venuePriceType: b.venue_price_type,
    customPricePerGuest:
      b.venue_price_type === "custom" ? b.venue_price_per_guest : undefined,
    venueName: b.venue_name ?? undefined,
    selections: b.selections ?? undefined,
  };
  if (b.wedding_date) {
    base.weddingDate = b.wedding_date;
  }
  return { ...base, ...overrides };
}
