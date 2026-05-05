import { useEffect } from "react";
import {
  Navigate,
  Route,
  Routes,
  useLocation,
  useNavigate,
  useParams,
} from "react-router-dom";
import { ApiError, fetchBudget } from "@/shared/lib/api";
import { getCategory, type CategoryId } from "@wedding-hall/shared";
import {
  resumeWizardStep,
  wizardStateFromBudget,
} from "@/features/budget-wizard/lib/wizard-state-from-budget";
import { WizardProvider } from "@/features/budget-wizard/state/wizard-context";
import {
  WizardSessionProvider,
  useWizardSession,
} from "@/features/budget-wizard/state/wizard-session-context";
import { useWizard } from "@/features/budget-wizard/state/use-wizard";
import {
  wizardStepRequiresAuth,
  type WizardStepId,
  urlFor,
} from "@/features/budget-wizard/state/steps";
import { StepCouple } from "@/features/budget-wizard/components/StepCouple";
import { StepDate } from "@/features/budget-wizard/components/StepDate";
import { StepGuests } from "@/features/budget-wizard/components/StepGuests";
import { StepType } from "@/features/budget-wizard/components/StepType";
import { CategoryStep } from "@/features/budget-wizard/components/CategoryStep";
import { StepContinueGate } from "@/features/budget-wizard/components/StepContinueGate";
import { StepCompletion } from "@/features/budget-wizard/components/StepCompletion";
import { StepAuthGate } from "@/features/budget-wizard/components/StepAuthGate";
import { PersistBudgetAfterAuth } from "@/features/budget-wizard/components/PersistBudgetAfterAuth";
import type { WizardPostLoginRouterState } from "@/features/budget-wizard/lib/wizard-post-login-router-state";

// Slug ↔ step id (slug uses dashes, step ids use underscores).
function slugToStepId(slug: string | undefined): WizardStepId | null {
  if (!slug) return null;
  const id = slug.replace(/-/g, "_") as WizardStepId;
  return id;
}

const CATEGORY_STEPS: ReadonlyArray<{
  stepId: WizardStepId;
  categoryId: CategoryId;
}> = [
  { stepId: "venue", categoryId: "venue" },
  { stepId: "food_upgrade", categoryId: "food_upgrade" },
  { stepId: "bar", categoryId: "bar" },
  { stepId: "dj", categoryId: "dj" },
  { stepId: "photo", categoryId: "photo" },
  { stepId: "flowers", categoryId: "flowers" },
  { stepId: "planner", categoryId: "planner" },
  { stepId: "addons", categoryId: "addons" },
  { stepId: "bride", categoryId: "bride" },
  { stepId: "groom", categoryId: "groom" },
  { stepId: "villa", categoryId: "villa" },
  { stepId: "transport", categoryId: "transport" },
  { stepId: "car_rental", categoryId: "car_rental" },
  { stepId: "makeup", categoryId: "makeup" },
  { stepId: "hidden_costs", categoryId: "hidden_costs" },
];

export function StepRenderer() {
  const { step } = useParams<{ step: string }>();
  const stepId = slugToStepId(step);
  const { session, loading } = useWizardSession();

  if (!stepId) return <Navigate to="/start" replace />;

  const needsAuthShell =
    wizardStepRequiresAuth(stepId) && loading;
  const needsGuestGate =
    wizardStepRequiresAuth(stepId) && !loading && session === null;

  if (needsAuthShell) {
    return (
      <main className="wh-page-center-muted" aria-busy aria-live="polite">
        טוען…
      </main>
    );
  }

  if (needsGuestGate) {
    return <StepAuthGate intendedStepId={stepId} />;
  }

  if (stepId === "couple") return <StepCouple />;
  if (stepId === "date") return <StepDate />;
  if (stepId === "guests") return <StepGuests />;
  if (stepId === "type") return <StepType />;
  if (stepId === "continue_gate") return <StepContinueGate />;
  if (stepId === "completion") return <StepCompletion />;

  const cat = CATEGORY_STEPS.find((c) => c.stepId === stepId);
  if (cat) {
    const def = getCategory(cat.categoryId);
    if (def) return <CategoryStep stepId={stepId} category={def} />;
  }
  return <Navigate to="/start" replace />;
}

// First-mount: if a budget already exists on the server, hydrate the
// wizard with it so users can edit instead of starting over. Then jump
// to whatever step makes sense.
export function HydrateAndStart() {
  const navigate = useNavigate();
  const { hydrateFromBudget } = useWizard();
  const { session, loading } = useWizardSession();

  useEffect(() => {
    if (loading) return;
    let cancelled = false;

    (async () => {
      if (session?.access_token) {
        try {
          const budget = await fetchBudget();
          if (cancelled) return;
          if (budget) {
            hydrateFromBudget(budget);
            const resume = resumeWizardStep(wizardStateFromBudget(budget));
            navigate(urlFor(resume), { replace: true });
            return;
          }
          navigate("/start/couple", { replace: true });
          return;
        } catch (err) {
          if (cancelled) return;
          if (!(err instanceof ApiError && err.kind === "unauthorized")) {
            console.error("HydrateAndStart fetchBudget", err);
          }
          navigate("/start/couple", { replace: true });
          return;
        }
      }

      navigate("/start/couple", { replace: true });
    })();

    return () => {
      cancelled = true;
    };
  }, [navigate, hydrateFromBudget, session, loading]);

  return (
    <main className="wh-page-center-muted">
      מכינים את השאלון…
    </main>
  );
}

function WizardRoutes() {
  const location = useLocation();
  const initialPostLoginSave = Boolean(
    (location.state as WizardPostLoginRouterState | null | undefined)
      ?.whPostWizardSaveDraft,
  );
  return (
    <WizardProvider initialPostLoginBudgetDraftSaveRequested={initialPostLoginSave}>
      <PersistBudgetAfterAuth />
      <Routes>
        <Route index element={<HydrateAndStart />} />
        <Route path=":step" element={<StepRenderer />} />
        <Route path="*" element={<Navigate to="/start" replace />} />
      </Routes>
    </WizardProvider>
  );
}

export function WizardPage() {
  return (
    <WizardSessionProvider>
      <WizardRoutes />
    </WizardSessionProvider>
  );
}

export default WizardPage;
