"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { VENUE_PRICES } from "@/lib/venue-pricing";
import type { VenuePriceType, WeddingType } from "@/lib/types";

export type SaveBudgetInput = {
  coupleName1: string;
  coupleName2: string;
  preferredDay: string;
  guestCount: number;
  weddingType: WeddingType;
  venuePriceType: VenuePriceType;
  customPricePerGuest?: number;
  venueName?: string;
};

export async function saveBudget(input: SaveBudgetInput) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const pricePerGuest =
    input.venuePriceType === "custom"
      ? Math.max(0, Math.floor(input.customPricePerGuest ?? 0))
      : VENUE_PRICES[input.venuePriceType];

  const guestCount = Math.max(0, Math.floor(input.guestCount));
  const estimatedTotal = guestCount * pricePerGuest;

  const { error } = await supabase.from("wedding_budgets").insert({
    user_id: user.id,
    couple_name_1: input.coupleName1.trim(),
    couple_name_2: input.coupleName2.trim(),
    preferred_day: input.preferredDay.trim() || null,
    guest_count: guestCount,
    wedding_type: input.weddingType,
    venue_price_type: input.venuePriceType,
    venue_price_per_guest: pricePerGuest,
    venue_name:
      input.venuePriceType === "custom" && input.venueName?.trim()
        ? input.venueName.trim()
        : null,
    estimated_total: estimatedTotal,
  });

  if (error) {
    console.error("saveBudget insert error", error);
    throw new Error("Could not save budget. Please try again.");
  }

  redirect("/dashboard");
}
