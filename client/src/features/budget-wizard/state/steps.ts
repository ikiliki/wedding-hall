// Declarative ordering of every wizard step. The wizard router uses this
// to build "Next/Back" navigation without hard-coding URLs in each page.
//
// Phase 1 ships the "core" + "hall" branch + the optional "extended"
// branch. Outdoor / Unique flows show a polite stub for now.

export type WizardStepId =
  // Core (everyone)
  | "couple"
  | "date"
  | "guests"
  | "type"
  // Hall flow
  | "venue"
  | "food_upgrade"
  | "bar"
  | "dj"
  | "photo"
  | "flowers"
  | "planner"
  | "addons"
  | "continue_gate"
  // Extended flow (only if continued_extended)
  | "bride"
  | "groom"
  | "villa"
  | "transport"
  | "car_rental"
  | "makeup"
  | "hidden_costs"
  | "completion";

export const WIZARD_PATH: ReadonlyArray<WizardStepId> = [
  "couple",
  "date",
  "guests",
  "type",
  "venue",
  "food_upgrade",
  "bar",
  "dj",
  "photo",
  "flowers",
  "planner",
  "addons",
  "continue_gate",
  "bride",
  "groom",
  "villa",
  "transport",
  "car_rental",
  "makeup",
  "hidden_costs",
  "completion",
];

// Hall flow ends at the gate; extended flow ends at completion.
export const HALL_FINAL_STEP: WizardStepId = "continue_gate";

export function nextStep(current: WizardStepId): WizardStepId | null {
  const i = WIZARD_PATH.indexOf(current);
  if (i < 0 || i >= WIZARD_PATH.length - 1) return null;
  return WIZARD_PATH[i + 1];
}

export function previousStep(current: WizardStepId): WizardStepId | null {
  const i = WIZARD_PATH.indexOf(current);
  if (i <= 0) return null;
  return WIZARD_PATH[i - 1];
}

// Total numbered steps for the progress bar. We exclude the completion
// screen because it's not a question.
export const TOTAL_STEPS = WIZARD_PATH.length - 1;

export function stepNumber(id: WizardStepId): number {
  const i = WIZARD_PATH.indexOf(id);
  return i + 1;
}

export function urlFor(id: WizardStepId): string {
  return `/start/${id.replace(/_/g, "-")}`;
}
