import { useEffect, useState } from "react";
import { Route, Routes, useNavigate } from "react-router-dom";
import type { WeddingBudget } from "@wedding-hall/shared";
import { BudgetSummary } from "@/features/dashboard/components/BudgetSummary";
import { DashboardShell } from "@/features/dashboard/components/DashboardShell";
import { VendorBrowsePage } from "@/features/dashboard/pages/VendorBrowsePage";
import { RequireAuth } from "@/shared/components/RequireAuth";
import { ApiError, fetchBudget } from "@/shared/lib/api";

export function DashboardContent() {
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
            : "לא ניתן לטעון את תקציב החתונה.",
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
        <p style={{ margin: 0, textAlign: "right", color: "var(--stl-outline)" }}>
          טוען…
        </p>
      </DashboardShell>
    );
  }

  if (errorMessage) {
    return (
      <DashboardShell>
        <p style={{ margin: 0, textAlign: "right", color: "rgb(186 26 26)" }}>
          {errorMessage}
        </p>
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
      <Routes>
        <Route index element={<DashboardContent />} />
        <Route path="vendors" element={<VendorBrowsePage />} />
      </Routes>
    </RequireAuth>
  );
}

export default DashboardPage;
