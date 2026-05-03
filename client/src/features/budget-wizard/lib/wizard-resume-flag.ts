import { WIZARD_PATH, wizardStepRequiresAuth, type WizardStepId } from "../state/steps";

/**
 * Whether returning to this path after login should kick a one-shot PUT so
 * anonymous draft selections (through venue) persist for the signed-in user.
 */
export function wizardResumePathMeansPostLoginSave(returnPath?: string): boolean {
  if (!returnPath?.startsWith("/start/")) return false;
  const underscored = returnPath
    .slice("/start/".length)
    .replace(/-/g, "_") as WizardStepId;
  if (!WIZARD_PATH.some((id) => id === underscored)) return false;
  return wizardStepRequiresAuth(underscored);
}
