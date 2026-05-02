import type { SaveBudgetPayload } from "@wedding-hall/shared";
import { ApiError, saveBudget as saveBudgetApi } from "@/shared/lib/api";

// Wraps the raw API call so the wizard can throw user-friendly errors.
// Validation + total computation happen on the server (`PUT /api/budget`).
export async function saveBudget(input: SaveBudgetPayload): Promise<void> {
  try {
    await saveBudgetApi(input);
  } catch (err) {
    if (err instanceof ApiError) {
      console.error("saveBudget API error", err);
      if (err.kind === "tables_missing") {
        throw new Error(
          "Database tables are missing. Run supabase/seed.sql once, then try again.",
        );
      }
      if (err.kind === "unauthorized") {
        throw new Error("Please sign in again.");
      }
      throw new Error(err.message || "Could not save budget. Please try again.");
    }
    throw err;
  }
}
