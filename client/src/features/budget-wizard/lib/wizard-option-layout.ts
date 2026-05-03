/** How to lay out a fixed list of wizard choices (not catalog-driven `range`). */
export type WizardChoicesLayout = "stack" | "toggle";

/** Exactly two choices → segmented toggle row; three or more → one full-width row each. */
export function choicesLayoutFromCount(count: number): WizardChoicesLayout {
  return count === 2 ? "toggle" : "stack";
}

export const wizardOptLayoutClass = "wh-wizard-opt-layout";
