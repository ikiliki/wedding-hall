import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ALL_CATEGORIES,
  computeBudgetTotals,
  formatILS,
  type CategoryDef,
  type WeddingBudget,
} from "@wedding-hall/shared";
import { DashboardShell } from "@/features/dashboard/components/DashboardShell";
import { Button } from "@/shared/components/Button";
import { Field } from "@/shared/components/Field";
import { RequireAuth } from "@/shared/components/RequireAuth";
import { ApiError, fetchBudget, saveBudget } from "@/shared/lib/api";
import * as styles from "./BudgetPage.styles";

type LineRow = {
  category: CategoryDef;
  estimated: number;
  actual: number;
};

function BudgetContent() {
  const navigate = useNavigate();
  const [budget, setBudget] = useState<WeddingBudget | null>(null);
  const [actuals, setActuals] = useState<Record<string, number>>({});
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await fetchBudget();
        if (cancelled) return;
        if (!data) {
          navigate("/start", { replace: true });
          return;
        }
        setBudget(data);
        const rawActuals = data.selections?.actuals ?? {};
        const flatActuals: Record<string, number> = {};
        for (const [k, v] of Object.entries(rawActuals)) {
          if (typeof v === "number") flatActuals[k] = v;
        }
        setActuals(flatActuals);
      } catch (err) {
        if (cancelled) return;
        if (err instanceof ApiError && err.kind === "unauthorized") {
          navigate("/login", { replace: true });
          return;
        }
        setErrorMessage(
          err instanceof Error ? err.message : "Could not load your budget.",
        );
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [navigate]);

  const persistActuals = useCallback(
    async (nextActuals: Record<string, number>) => {
      if (!budget) return;
      setSaving(true);
      setErrorMessage(null);
      try {
        await saveBudget({
          coupleName1: budget.couple_name_1,
          coupleName2: budget.couple_name_2,
          preferredDay: budget.preferred_day ?? "",
          guestCount: budget.guest_count,
          guestCountMin: budget.guest_count_min ?? undefined,
          guestCountMax: budget.guest_count_max ?? undefined,
          weddingType: budget.wedding_type,
          venuePriceType: budget.venue_price_type,
          customPricePerGuest:
            budget.venue_price_type === "custom"
              ? budget.venue_price_per_guest
              : undefined,
          venueName: budget.venue_name ?? undefined,
          selections: {
            ...(budget.selections ?? { selections: {} }),
            actuals: nextActuals,
          },
        });
      } catch (err) {
        if (err instanceof ApiError) {
          setErrorMessage(err.message);
        } else {
          setErrorMessage(
            err instanceof Error ? err.message : "Could not save actuals.",
          );
        }
      } finally {
        setSaving(false);
      }
    },
    [budget],
  );

  function handleActualChange(categoryId: string, raw: string) {
    const value = raw === "" ? 0 : Math.max(0, Math.floor(Number(raw)));
    setActuals((prev) => {
      const next = { ...prev };
      if (raw === "" || value === 0) {
        delete next[categoryId];
      } else {
        next[categoryId] = value;
      }
      // Debounced save: fire-and-forget; the latest write wins.
      void persistActuals(next);
      return next;
    });
  }

  if (errorMessage && !budget) {
    return (
      <DashboardShell>
        <p className="text-sm text-red-400">{errorMessage}</p>
      </DashboardShell>
    );
  }
  if (!budget) {
    return (
      <DashboardShell>
        <p className="text-sm text-muted">Loading…</p>
      </DashboardShell>
    );
  }

  const selections = budget.selections?.selections ?? {};
  const guestMid =
    budget.guest_count ||
    Math.round(((budget.guest_count_min ?? 0) + (budget.guest_count_max ?? 0)) / 2);
  const totals = computeBudgetTotals(selections, guestMid);
  const totalEstimated =
    totals.total > 0 ? totals.total : budget.estimated_total;

  const rows: LineRow[] = ALL_CATEGORIES.filter((c) => selections[c.id]).map(
    (category) => {
      const line = totals.lines.find((l) => l.categoryId === category.id);
      return {
        category,
        estimated: line?.amount ?? 0,
        actual: actuals[category.id] ?? 0,
      };
    },
  );

  const totalActual = Object.values(actuals).reduce((s, v) => s + v, 0);
  const delta = totalActual - totalEstimated;

  return (
    <DashboardShell>
      <section className={styles.totalsRow}>
        <div className={styles.totalCard}>
          <p className={styles.eyebrow}>Estimated</p>
          <p className={styles.amount}>{formatILS(totalEstimated)}</p>
          <p className={styles.sub}>From the wizard answers.</p>
        </div>
        <div className={styles.totalCard}>
          <p className={styles.eyebrow}>Actual so far</p>
          <p className={styles.amount}>{formatILS(totalActual)}</p>
          <p className={styles.sub}>
            {totalActual === 0
              ? "Fill in real prices below as you book."
              : `${delta >= 0 ? "+" : "-"}${formatILS(Math.abs(delta))} vs. estimate`}
          </p>
        </div>
      </section>

      <section>
        <h2 className={styles.heading}>Line items</h2>
        {rows.length === 0 ? (
          <p className={styles.empty}>
            You haven't answered any wizard categories yet. Open the wizard
            to start filling in your budget.
          </p>
        ) : (
          <div className={styles.table}>
            <div className={styles.tableHead}>
              <span>Category</span>
              <span className={styles.headRight}>Estimated</span>
              <span className={styles.headRight}>Actual</span>
            </div>
            {rows.map((row) => (
              <div key={row.category.id} className={styles.tableRow}>
                <span className={styles.cellLabel}>{row.category.title}</span>
                <span className={styles.cellEstimated}>
                  {formatILS(row.estimated)}
                </span>
                <Field
                  id={`actual-${row.category.id}`}
                  type="number"
                  inputMode="numeric"
                  min={0}
                  step={100}
                  size="md"
                  className={styles.cellInput}
                  value={
                    actuals[row.category.id]
                      ? String(actuals[row.category.id])
                      : ""
                  }
                  onChange={(e) =>
                    handleActualChange(row.category.id, e.target.value)
                  }
                  placeholder="0"
                />
              </div>
            ))}
          </div>
        )}
        {errorMessage && (
          <p className="mt-4 text-sm text-red-400">{errorMessage}</p>
        )}
        <div className={styles.footerRow}>
          <Button
            type="button"
            variant="ghost"
            onClick={() => navigate("/start")}
          >
            Edit answers
          </Button>
          <span className={styles.savingHint}>
            {saving ? "Saving…" : "Auto-saves as you type"}
          </span>
        </div>
      </section>
    </DashboardShell>
  );
}

export function BudgetPage() {
  return (
    <RequireAuth>
      <BudgetContent />
    </RequireAuth>
  );
}

export default BudgetPage;
