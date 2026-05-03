// Shared DTO types for Wedding Hall.
// Source of truth — both `client/` and `server/` import from here so the
// HTTP boundary between them stays in lock-step with the database schema
// (see `supabase/schema.sql`).

import type { BudgetSelections } from "./budget-selections";

export type Profile = {
  id: string;
  email: string | null;
  full_name: string | null;
  // Phase 1+: marks the row's owner as a Wedding Hall admin (manually
  // flipped via SQL). Used by the client to gate the `/admin` route.
  is_admin: boolean;
  created_at: string;
  updated_at: string;
};

export type WeddingType = "hall";

export type VenuePriceType = "cheap" | "average" | "premium" | "custom";

// Day-of-week buckets used by the wizard. Friday is intentionally split
// because some venues offer a half-Friday (short) wedding option.
export type PreferredDay =
  | "sun_tue"
  | "wed"
  | "thu"
  | "fri_short"
  | "fri_full";

// Approximate guest-count range — venues quote against a "safe number".
export type GuestRange = {
  min: number;
  max: number;
};

export type WeddingBudget = {
  id: string;
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
  /** Optional calendar date (`YYYY-MM-DD`) for countdown on the dashboard. */
  wedding_date?: string | null;
  created_at: string;
  updated_at: string;
};

// Wire-format payload the client POSTs to `PUT /api/budget`.
// The server validates, computes `estimated_total`, and never trusts a
// caller-supplied `user_id`.
export type SaveBudgetPayload = {
  coupleName1: string;
  coupleName2: string;
  preferredDay: string;
  guestCount: number;
  guestCountMin?: number;
  guestCountMax?: number;
  weddingType: WeddingType;
  venuePriceType: VenuePriceType;
  customPricePerGuest?: number;
  venueName?: string;
  selections?: BudgetSelections;
  /** `YYYY-MM-DD`, or null to clear. Omit to leave the stored value unchanged. */
  weddingDate?: string | null;
};

// Wire-format payload for `POST /api/profiles`.
export type UpsertProfilePayload = {
  email?: string | null;
  full_name?: string | null;
};
