// React provider for the budget-wizard state container.
// Owns:
//   - Couple identity, date bucket, guest range, wedding type
//   - Per-category selections (catalog-driven)
//   - In-memory draft state while navigating wizard steps
//   - Server save (PUT /api/budget) at the post-hall gate and on completion
//
// All types + the context object itself live in `./wizard-types.ts` so
// React Refresh can hot-reload this provider cleanly.

import { useCallback, useState, type ReactNode } from "react";
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

export type WizardProviderProps = {
  children: ReactNode;
  /**
   * When the user landed on `/start` from `/login`, React Router carries a
   * one-shot flag in `location.state`; we stash it once (first mount) so deep
   * wizard navigations cannot drop sessionStorage/session flags.
   */
  initialPostLoginBudgetDraftSaveRequested?: boolean;
};

export function WizardProvider({
  children,
  initialPostLoginBudgetDraftSaveRequested = false,
}: WizardProviderProps) {
  const [state, setState] = useState<WizardState>(EMPTY);
  const [postLoginBudgetDraftSaveRequested, setPostLoginBudgetDraftSaveRequested] =
    useState(() => initialPostLoginBudgetDraftSaveRequested);

  let guestMid = 0;
  if (typeof state.guestMin === "number" && typeof state.guestMax === "number") {
    guestMid = Math.round((state.guestMin + state.guestMax) / 2);
  } else if (typeof state.guestMax === "number") {
    guestMid = state.guestMax;
  } else if (typeof state.guestMin === "number") {
    guestMid = state.guestMin;
  }

  const totals = computeBudgetTotals(state.selections, guestMid);
  const totalLines = totals.lines
    .filter((l) => l.amount > 0)
    .map((l) => ({ label: l.label, amount: l.amount }));

  const clearPostLoginBudgetDraftSaveRequest = useCallback(() => {
    setPostLoginBudgetDraftSaveRequested(false);
  }, []);

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
    setPostLoginBudgetDraftSaveRequested(false);
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

  const value: Ctx = {
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
    postLoginBudgetDraftSaveRequested,
    clearPostLoginBudgetDraftSaveRequest,
  };

  return (
    <WizardContext.Provider value={value}>{children}</WizardContext.Provider>
  );
}
