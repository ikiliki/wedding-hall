export type Profile = {
  id: string;
  email: string | null;
  full_name: string | null;
  created_at: string;
  updated_at: string;
};

export type WeddingType = "hall";

export type VenuePriceType = "cheap" | "average" | "premium" | "custom";

export type WeddingBudget = {
  id: string;
  user_id: string;
  couple_name_1: string;
  couple_name_2: string;
  preferred_day: string | null;
  guest_count: number;
  wedding_type: WeddingType;
  venue_price_type: VenuePriceType;
  venue_price_per_guest: number;
  venue_name: string | null;
  estimated_total: number;
  created_at: string;
  updated_at: string;
};
