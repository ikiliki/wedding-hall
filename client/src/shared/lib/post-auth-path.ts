import type { SupabaseClient } from "@supabase/supabase-js";
import { ApiError, fetchBudget } from "@/shared/lib/api";
import { safeWizardReturnPath } from "@/shared/lib/safe-return-path";

// Decide where to send the user right after auth succeeds:
//   - explicit returnTo (sanitized wizard path) when provided
//   - /login     if there's no session
//   - /dashboard if they already have a budget on file
//   - /start     otherwise (the new multi-step wizard)
//
// Budget existence is checked through the Wedding Hall server (RLS still
// applies via the user's JWT), so the browser never queries Postgres
// directly anymore.
export async function getPostAuthPath(
  supabase: SupabaseClient,
  returnToRaw?: string | null,
): Promise<string> {
  const explicit = safeWizardReturnPath(returnToRaw ?? undefined);
  if (explicit) return explicit;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return "/login";

  try {
    const budget = await fetchBudget();
    return budget ? "/dashboard" : "/start";
  } catch (err) {
    if (err instanceof ApiError && err.kind === "unauthorized") {
      return "/login";
    }
    // Network / server hiccup — fall back to the wizard so the user can
    // still try to write something. The dashboard reloads on its own
    // when the server recovers.
    console.error("getPostAuthPath fetchBudget failed", err);
    return "/start";
  }
}
