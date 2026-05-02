import { useEffect } from "react";
import {
  Navigate,
  Route,
  Routes,
  useNavigate,
  useParams,
} from "react-router-dom";
import { RequireAuth } from "@/shared/components/RequireAuth";
import { ApiError, fetchBudget } from "@/shared/lib/api";
import { getCategory, type CategoryId } from "@wedding-hall/shared";
import { WizardProvider } from "@/features/budget-wizard/state/wizard-context";
import { useWizard } from "@/features/budget-wizard/state/use-wizard";
import { StepCouple } from "@/features/budget-wizard/components/StepCouple";
import { StepDate } from "@/features/budget-wizard/components/StepDate";
import { StepGuests } from "@/features/budget-wizard/components/StepGuests";
import { StepType } from "@/features/budget-wizard/components/StepType";
import { CategoryStep } from "@/features/budget-wizard/components/CategoryStep";
import { StepContinueGate } from "@/features/budget-wizard/components/StepContinueGate";
import { StepCompletion } from "@/features/budget-wizard/components/StepCompletion";
import { type WizardStepId } from "@/features/budget-wizard/state/steps";

// Slug ↔ step id (slug uses dashes, step ids use underscores).
function slugToStepId(slug: string | undefined): WizardStepId | null {
  if (!slug) return null;
  const id = slug.replace(/-/g, "_") as WizardStepId;
  return id;
}

const CATEGORY_STEPS: ReadonlyArray<{ stepId: WizardStepId; categoryId: CategoryId }> = [
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

function StepRenderer() {
  const { step } = useParams<{ step: string }>();
  const stepId = slugToStepId(step);
  if (!stepId) return <Navigate to="/start" replace />;

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
function HydrateAndStart() {
  const navigate = useNavigate();
  const { state } = useWizard();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const budget = await fetchBudget();
        if (cancelled) return;
        // If we already have a saved server-side budget, jump straight
        // into the dashboard. The wizard re-entry happens via "Edit".
        if (budget && (state.coupleName1 === "" || state.coupleName2 === "")) {
          navigate("/dashboard", { replace: true });
          return;
        }
        navigate("/start/couple", { replace: true });
      } catch (err) {
        if (cancelled) return;
        if (err instanceof ApiError && err.kind === "unauthorized") {
          navigate("/login", { replace: true });
          return;
        }
        // Server hiccup — let the user start the wizard anyway.
        navigate("/start/couple", { replace: true });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [navigate, state.coupleName1, state.coupleName2]);

  return (
    <main className="flex min-h-dvh items-center justify-center text-sm text-muted">
      Preparing your wizard…
    </main>
  );
}

export function WizardPage() {
  return (
    <RequireAuth>
      <WizardProvider>
        <Routes>
          <Route index element={<HydrateAndStart />} />
          <Route path=":step" element={<StepRenderer />} />
          <Route path="*" element={<Navigate to="/start" replace />} />
        </Routes>
      </WizardProvider>
    </RequireAuth>
  );
}

export default WizardPage;
