// React provider for the budget-wizard state container.
// Owns:
//   - Couple identity, date bucket, guest range, wedding type
//   - Per-category selections (catalog-driven)
//   - localStorage persistence so a refresh mid-flow doesn't lose progress
//   - Server save (PUT /api/budget) at the post-hall gate and on completion
//
// All types + the context object itself live in `./wizard-types.ts` so
// React Refresh can hot-reload this provider cleanly.

import { useCallback, useEffect, useMemo, useState } from "react";
import type {
  CategoryId,
  CategorySelection,
  PreferredDay,
  SaveBudgetPayload,
  VenuePriceType,
  WeddingBudget,
  WeddingType,
} from "@wedding-hall/shared";
import { computeBudgetTotals, getCategory } from "@wedding-hall/shared";
import { saveBudget } from "@/features/budget-wizard/lib/saveBudget";
import { wizardStateFromBudget } from "@/features/budget-wizard/lib/wizard-state-from-budget";
import {
  WizardContext,
  type Ctx,
  type SaveServerOptions,
  type WizardState,
  type WizardSubtype,
} from "./wizard-types";

const STORAGE_KEY = "wh.wizard.v1";

const EMPTY: WizardState = {
  coupleName1: "",
  coupleName2: "",
  preferredDay: "",
  guestMin: "",
  guestMax: "",
  weddingTypeKind: "hall",
  selections: {},
  continuedExtended: false,
  actuals: {},
  celebrationDate: "",
};

function loadFromStorage(): WizardState {
  if (typeof window === "undefined") return EMPTY;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY;
    const parsed = JSON.parse(raw);
    return { ...EMPTY, ...parsed };
  } catch {
    return EMPTY;
  }
}

export function WizardProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<WizardState>(() => loadFromStorage());

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Storage might be full or disabled (private mode). Ignore — the
      // server save still works; the user just loses crash recovery.
    }
  }, [state]);

  const guestMid = useMemo(() => {
    if (typeof state.guestMin === "number" && typeof state.guestMax === "number") {
      return Math.round((state.guestMin + state.guestMax) / 2);
    }
    if (typeof state.guestMax === "number") return state.guestMax;
    if (typeof state.guestMin === "number") return state.guestMin;
    return 0;
  }, [state.guestMin, state.guestMax]);

  const totals = useMemo(
    () => computeBudgetTotals(state.selections, guestMid),
    [state.selections, guestMid],
  );

  const totalLines = useMemo(
    () =>
      totals.lines
        .filter((l) => l.amount > 0)
        .map((l) => ({ label: l.label, amount: l.amount })),
    [totals],
  );

  const setCouple = useCallback((name1: string, name2: string) => {
    setState((s) => ({ ...s, coupleName1: name1, coupleName2: name2 }));
  }, []);

  const setDay = useCallback((day: PreferredDay) => {
    setState((s) => ({ ...s, preferredDay: day }));
  }, []);

  const setGuestRange = useCallback((min: number, max: number) => {
    setState((s) => ({ ...s, guestMin: min, guestMax: max }));
  }, []);

  const setSubtype = useCallback((kind: WizardSubtype) => {
    setState((s) => ({ ...s, weddingTypeKind: kind }));
  }, []);

  const setSelection = useCallback(
    (categoryId: CategoryId, selection: CategorySelection | undefined) => {
      setState((s) => {
        const next = { ...s.selections };
        if (selection === undefined) {
          delete next[categoryId];
        } else {
          next[categoryId] = selection;
        }
        return { ...s, selections: next };
      });
    },
    [],
  );

  const setContinuedExtended = useCallback((v: boolean) => {
    setState((s) => ({ ...s, continuedExtended: v }));
  }, []);

  const setActual = useCallback((lineId: string, amount: number) => {
    setState((s) => ({
      ...s,
      actuals: { ...s.actuals, [lineId]: Math.max(0, Math.floor(amount)) },
    }));
  }, []);

  const setCelebrationDate = useCallback((iso: string) => {
    setState((s) => ({ ...s, celebrationDate: iso }));
  }, []);

  const hydrateFromBudget = useCallback((b: WeddingBudget) => {
    setState(wizardStateFromBudget(b));
  }, []);

  const reset = useCallback(() => {
    setState(EMPTY);
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  const saveServer = useCallback(async (opts?: SaveServerOptions) => {
    // Pull venue tier info for the legacy DB columns (the server still
    // stores venue_price_type / venue_price_per_guest as denormalised
    // values for the dashboard quick view).
    const venueSel = state.selections.venue;
    let venuePriceType: VenuePriceType = "average";
    let customPricePerGuest: number | undefined;
    let venueName: string | undefined;
    if (venueSel?.kind === "tier") {
      const def = getCategory("venue");
      const tier = def?.tiers?.find((t) => t.id === venueSel.optionId);
      if (tier?.custom) {
        venuePriceType = "custom";
        customPricePerGuest = venueSel.customPrice;
        venueName = venueSel.customLabel;
      } else if (
        venueSel.optionId === "cheap" ||
        venueSel.optionId === "average" ||
        venueSel.optionId === "premium"
      ) {
        venuePriceType = venueSel.optionId;
      }
    }

    const weddingType: WeddingType = "hall";
    const guestCount = guestMid;

    const continuedExtended =
      opts?.continuedExtended !== undefined
        ? opts.continuedExtended
        : state.continuedExtended;

    const payload: SaveBudgetPayload = {
      coupleName1: state.coupleName1.trim(),
      coupleName2: state.coupleName2.trim(),
      preferredDay: state.preferredDay || "",
      guestCount,
      guestCountMin:
        typeof state.guestMin === "number" ? state.guestMin : undefined,
      guestCountMax:
        typeof state.guestMax === "number" ? state.guestMax : undefined,
      weddingType,
      venuePriceType,
      customPricePerGuest,
      venueName,
      selections: {
        selections: state.selections,
        actuals: state.actuals,
        weddingTypeKind: state.weddingTypeKind,
        continuedExtended,
      },
    };

    payload.weddingDate = state.celebrationDate.trim() || null;

    await saveBudget(payload);
  }, [state, guestMid]);

  const value: Ctx = useMemo(
    () => ({
      state,
      guestMid,
      total: totals.total,
      totalLines,
      setCouple,
      setDay,
      setGuestRange,
      setSubtype,
      setSelection,
      setContinuedExtended,
      setActual,
      setCelebrationDate,
      hydrateFromBudget,
      reset,
      saveServer,
    }),
    [
      state,
      guestMid,
      totals.total,
      totalLines,
      setCouple,
      setDay,
      setGuestRange,
      setSubtype,
      setSelection,
      setContinuedExtended,
      setActual,
      setCelebrationDate,
      hydrateFromBudget,
      reset,
      saveServer,
    ],
  );

  return (
    <WizardContext.Provider value={value}>{children}</WizardContext.Provider>
  );
}
