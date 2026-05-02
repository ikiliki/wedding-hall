import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { WeddingBudget } from "@wedding-hall/shared";
import { BudgetSummary } from "@/features/dashboard/components/BudgetSummary";
import { DashboardShell } from "@/features/dashboard/components/DashboardShell";
import { RequireAuth } from "@/shared/components/RequireAuth";
import { ApiError, fetchBudget } from "@/shared/lib/api";

function DashboardContent() {
  const navigate = useNavigate();
  const [budget, setBudget] = useState<WeddingBudget | null | undefined>(
    undefined,
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const data = await fetchBudget();
        if (cancelled) return;
        if (!data) {
          navigate("/start", { replace: true });
          return;
        }
        setBudget(data);
      } catch (err) {
        if (cancelled) return;
        if (err instanceof ApiError && err.kind === "unauthorized") {
          navigate("/login", { replace: true });
          return;
        }
        console.error("DashboardPage fetchBudget error", err);
        setErrorMessage(
          err instanceof Error
            ? err.message
            : "Could not load your wedding budget.",
        );
        setBudget(null);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [navigate]);

  if (budget === undefined) {
    return (
      <DashboardShell>
        <p className="text-sm text-muted">Loading…</p>
      </DashboardShell>
    );
  }

  if (errorMessage) {
    return (
      <DashboardShell>
        <p className="text-sm text-red-400">{errorMessage}</p>
      </DashboardShell>
    );
  }

  if (!budget) return null;

  return (
    <DashboardShell>
      <BudgetSummary budget={budget} />
    </DashboardShell>
  );
}

export function DashboardPage() {
  return (
    <RequireAuth>
      <DashboardContent />
    </RequireAuth>
  );
}

export default DashboardPage;
