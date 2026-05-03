import type { WizardState } from "@/features/budget-wizard/state/wizard-types";
import {
  EXTENDED_CATEGORIES,
  HALL_CATEGORIES,
  type CategoryId,
  type PreferredDay,
  type WeddingBudget,
} from "@wedding-hall/shared";
import type { WizardStepId } from "@/features/budget-wizard/state/steps";
import { isValidCelebrationDate } from "@/features/budget-wizard/lib/celebration-date";

const KNOWN_DAY: ReadonlyArray<PreferredDay> = [
  "sun_tue",
  "wed",
  "thu",
  "fri_short",
  "fri_full",
];

function normalizePreferred(day: string | null | undefined): PreferredDay | "" {
  if (!day) return "";
  return KNOWN_DAY.includes(day as PreferredDay) ? (day as PreferredDay) : "";
}

function categoryResumeStep(catId: CategoryId): WizardStepId {
  return catId as WizardStepId;
}

export function wizardStateFromBudget(b: WeddingBudget): WizardState {
  const sel = b.selections;
  const rawActuals = sel?.actuals ?? {};
  const actuals: Record<string, number> = {};
  for (const [key, val] of Object.entries(rawActuals)) {
    if (typeof val === "number" && Number.isFinite(val)) {
      actuals[key] = Math.max(0, Math.floor(val));
    }
  }

  let guestMin: number | "";
  let guestMax: number | "";
  if (
    typeof b.guest_count_min === "number" &&
    typeof b.guest_count_max === "number"
  ) {
    guestMin = b.guest_count_min;
    guestMax = b.guest_count_max;
  } else if (typeof b.guest_count === "number") {
    guestMin = b.guest_count;
    guestMax = b.guest_count;
  } else {
    guestMin = "";
    guestMax = "";
  }

  return {
    coupleName1: b.couple_name_1 ?? "",
    coupleName2: b.couple_name_2 ?? "",
    preferredDay: normalizePreferred(b.preferred_day),
    guestMin,
    guestMax,
    weddingTypeKind: sel?.weddingTypeKind ?? "hall",
    selections: { ...(sel?.selections ?? {}) },
    continuedExtended: Boolean(sel?.continuedExtended),
    actuals,
    celebrationDate: b.wedding_date ?? "",
  };
}

/** True when `/start` has meaningful local wizard state without a saved server budget yet. */
export function hasWizardDraftProgress(state: WizardState): boolean {
  return Boolean(
    state.coupleName1.trim() ||
      state.coupleName2.trim() ||
      state.preferredDay ||
      typeof state.guestMin === "number" ||
      typeof state.guestMax === "number" ||
      Object.keys(state.selections).length > 0,
  );
}

/**
 * Navigate here after hydrating from server (or restoring from local draft)
 * so the user lands on the first unanswered wizard screen.
 */
export function resumeWizardStep(state: WizardState): WizardStepId {
  if (!state.coupleName1.trim() || !state.coupleName2.trim()) return "couple";
  if (!state.preferredDay) return "date";
  if (!isValidCelebrationDate(state.celebrationDate ?? "")) return "date";
  if (typeof state.guestMin !== "number" || typeof state.guestMax !== "number") {
    return "guests";
  }

  const hallIncomplete = HALL_CATEGORIES.find(
    (c) => state.selections[c.id] == null,
  );
  if (hallIncomplete) return categoryResumeStep(hallIncomplete.id);

  if (!state.continuedExtended) return "continue_gate";

  const extendedIncomplete = EXTENDED_CATEGORIES.find(
    (c) => state.selections[c.id] == null,
  );
  if (extendedIncomplete) return categoryResumeStep(extendedIncomplete.id);

  return "completion";
}
