import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { BudgetSummary } from "@/features/dashboard/components/BudgetSummary";
import type { WeddingBudget } from "@/lib/types";

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: budget } = await supabase
    .from("wedding_budgets")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle<WeddingBudget>();

  if (!budget) {
    redirect("/onboarding");
  }

  return <BudgetSummary budget={budget} />;
}
