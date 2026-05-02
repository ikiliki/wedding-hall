import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { OnboardingWizard } from "@/features/onboarding/components/OnboardingWizard";
import { RequireAuth } from "@/shared/components/RequireAuth";
import { createClient } from "@/shared/lib/supabase";

function OnboardingGate() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) {
        navigate("/login", { replace: true });
        return;
      }
      const { data: existingBudget } = await supabase
        .from("wedding_budgets")
        .select("id")
        .eq("user_id", user.id)
        .limit(1)
        .maybeSingle();
      if (existingBudget) {
        navigate("/dashboard", { replace: true });
        return;
      }
      setReady(true);
    });
  }, [navigate]);

  if (!ready) {
    return (
      <main className="flex min-h-dvh items-center justify-center text-sm text-muted">
        Loading…
      </main>
    );
  }

  return <OnboardingWizard />;
}

export function OnboardingPage() {
  return (
    <RequireAuth>
      <OnboardingGate />
    </RequireAuth>
  );
}
