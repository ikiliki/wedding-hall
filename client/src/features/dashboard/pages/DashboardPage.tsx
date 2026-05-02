import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BudgetSummary } from "@/features/dashboard/components/BudgetSummary";
import { RequireAuth } from "@/shared/components/RequireAuth";
import { createClient } from "@/shared/lib/supabase";
import type { WeddingBudget } from "@/shared/lib/types";

function DashboardContent() {
  const navigate = useNavigate();
  const [budget, setBudget] = useState<WeddingBudget | null | undefined>(
    undefined,
  );

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) {
        navigate("/login", { replace: true });
        return;
      }
      const { data } = await supabase
        .from("wedding_budgets")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (!data) {
        navigate("/onboarding", { replace: true });
        return;
      }
      setBudget(data as WeddingBudget);
    });
  }, [navigate]);

  if (budget === undefined) {
    return (
      <main className="flex min-h-dvh items-center justify-center text-sm text-muted">
        Loading…
      </main>
    );
  }

  if (!budget) return null;

  return <BudgetSummary budget={budget} />;
}

export function DashboardPage() {
  return (
    <RequireAuth>
      <DashboardContent />
    </RequireAuth>
  );
}
