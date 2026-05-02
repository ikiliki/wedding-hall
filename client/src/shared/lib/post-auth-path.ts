import type { SupabaseClient } from "@supabase/supabase-js";

export async function getPostAuthPath(
  supabase: SupabaseClient,
): Promise<"/dashboard" | "/onboarding" | "/login"> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return "/login";
  const { data } = await supabase
    .from("wedding_budgets")
    .select("id")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();
  return data ? "/dashboard" : "/onboarding";
}
