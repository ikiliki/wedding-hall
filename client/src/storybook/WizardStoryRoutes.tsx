/** Mount wizard step routes exactly like `/start/:step` in the app shell. */

import type { ReactNode } from "react";
import { Route, Routes } from "react-router-dom";
import { WizardProvider } from "@/features/budget-wizard/state/wizard-context";
import {
  HydrateAndStart,
  StepRenderer,
} from "@/features/budget-wizard/pages/WizardPage";
import {
  PersistBudgetAfterAuth,
} from "@/features/budget-wizard/components/PersistBudgetAfterAuth";
import { WizardSessionProvider } from "@/features/budget-wizard/state/wizard-session-context";

/** Storybook-local routes for `/start` and `/start/:step` (underscore slugs → hyphens). */
export function WizardStoryRoutes({ extra }: { extra?: ReactNode }) {
  return (
    <WizardSessionProvider>
      <WizardProvider>
        <PersistBudgetAfterAuth />
        <Routes>
          <Route path="/start" element={<HydrateAndStart />} />
          <Route path="/start/:step" element={<StepRenderer />} />
        </Routes>
        {extra}
      </WizardProvider>
    </WizardSessionProvider>
  );
}
