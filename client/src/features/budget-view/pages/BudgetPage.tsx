import { useCallback, useEffect, useMemo, useState } from "react";
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

function actualsRecordFromSelections(
  raw: Partial<Record<string, number>> | undefined,
): Record<string, number> {
  const flat: Record<string, number> = {};
  if (!raw) return flat;
  for (const [k, v] of Object.entries(raw)) {
    if (typeof v === "number" && Number.isFinite(v)) flat[k] = v;
  }
  return flat;
}

function actualsEqual(
  a: Record<string, number>,
  b: Record<string, number>,
): boolean {
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  for (const k of keys) {
    const av = typeof a[k] === "number" ? a[k] : 0;
    const bv = typeof b[k] === "number" ? b[k] : 0;
    if (av !== bv) return false;
  }
  return true;
}

export function BudgetContent() {
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
        setActuals(actualsRecordFromSelections(data.selections?.actuals));
      } catch (err) {
        if (cancelled) return;
        if (err instanceof ApiError && err.kind === "unauthorized") {
          navigate("/login", { replace: true });
          return;
        }
        setErrorMessage(
          err instanceof Error ? err.message : "לא ניתן לטעון את התקציב.",
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
        const updated = await saveBudget({
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
        if (updated) {
          setBudget(updated);
          setActuals(actualsRecordFromSelections(updated.selections?.actuals));
        }
      } catch (err) {
        if (err instanceof ApiError) {
          setErrorMessage(err.message);
        } else {
          setErrorMessage(
            err instanceof Error ? err.message : "לא ניתן לשמור את הסכומים.",
          );
        }
      } finally {
        setSaving(false);
      }
    },
    [budget],
  );

  const savedActuals = useMemo(
    () => actualsRecordFromSelections(budget?.selections?.actuals),
    [budget],
  );

  const dirty = useMemo(
    () => budget != null && !actualsEqual(actuals, savedActuals),
    [budget, actuals, savedActuals],
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
      return next;
    });
  }

  if (errorMessage && !budget) {
    return (
      <DashboardShell>
        <p className="wh-text-error-sm">{errorMessage}</p>
      </DashboardShell>
    );
  }
  if (!budget) {
    return (
      <DashboardShell>
        <p className="wh-text-muted-sm">טוען…</p>
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
          <p className={styles.eyebrow}>אומדן</p>
          <p className={styles.amount}>{formatILS(totalEstimated)}</p>
          <p className={styles.sub}>לפי תשובות השאלון.</p>
        </div>
        <div className={styles.totalCard}>
          <p className={styles.eyebrow}>בפועל עד כה</p>
          <p className={styles.amount}>{formatILS(totalActual)}</p>
          <p className={styles.sub}>
            {totalActual === 0
              ? "מלאו מחירים אמיתיים למטה ככל שסוגרים עם ספקים."
              : `${delta >= 0 ? "+" : "-"}${formatILS(Math.abs(delta))} לעומת האומדן`}
          </p>
        </div>
      </section>

      <section>
        <h2 className={styles.heading}>פירוט שורות</h2>
        {rows.length === 0 ? (
          <p className={styles.empty}>
            עוד לא עניתם על קטגוריות בשאלון. פתחו את השאלון כדי להתחיל למלא
            את התקציב.
          </p>
        ) : (
          <div className={styles.table}>
            <div className={styles.tableHead}>
              <span>קטגוריה</span>
              <span className={styles.headRight}>אומדן</span>
              <span className={styles.headRight}>בפועל</span>
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
          <p className="wh-mt-4-error wh-text-error-sm">{errorMessage}</p>
        )}
        <div className={styles.footerRow}>
          {saving ? (
            <span className={styles.savingHint}>שומרים…</span>
          ) : null}
          <Button
            type="button"
            variant="primary"
            disabled={!dirty || saving || rows.length === 0}
            onClick={() => void persistActuals(actuals)}
          >
            שמירת שינויים
          </Button>
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
