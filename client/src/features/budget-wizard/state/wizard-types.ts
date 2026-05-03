// Types + the React context object for the budget wizard.
// Lives in a `.ts` file (no JSX) so React Refresh can hot-reload the
// `WizardProvider` component cleanly.

import { createContext } from "react";
import type {
  BudgetSelections,
  CategoryId,
  CategorySelection,
  PreferredDay,
  WeddingBudget,
} from "@wedding-hall/shared";

export type WizardSubtype = "hall" | "outdoor" | "unique";

export type WizardState = {
  coupleName1: string;
  coupleName2: string;
  preferredDay: PreferredDay | "";
  guestMin: number | "";
  guestMax: number | "";
  weddingTypeKind: WizardSubtype;
  selections: BudgetSelections["selections"];
  continuedExtended: boolean;
  actuals: Record<string, number>;
  /** Optional `YYYY-MM-DD` — saved with the budget for dashboard countdown. */
  celebrationDate: string;
};

export type SaveServerOptions = {
  continuedExtended?: boolean;
};

export type Ctx = {
  state: WizardState;
  guestMid: number;
  total: number;
  totalLines: { label: string; amount: number }[];
  setCouple: (name1: string, name2: string) => void;
  setDay: (day: PreferredDay) => void;
  setGuestRange: (min: number, max: number) => void;
  setSubtype: (kind: WizardSubtype) => void;
  setSelection: (categoryId: CategoryId, selection: CategorySelection | undefined) => void;
  setContinuedExtended: (v: boolean) => void;
  setActual: (lineId: string, amount: number) => void;
  setCelebrationDate: (iso: string) => void;
  hydrateFromBudget: (b: WeddingBudget) => void;
  reset: () => void;
  saveServer: (opts?: SaveServerOptions) => Promise<void>;
};

export const WizardContext = createContext<Ctx | null>(null);
