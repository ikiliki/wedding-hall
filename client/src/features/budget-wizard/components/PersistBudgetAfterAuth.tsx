import { useEffect, useRef } from "react";
import { useWizardSession } from "@/features/budget-wizard/state/wizard-session-context";
import { useWizard } from "@/features/budget-wizard/state/use-wizard";
import { hasWizardDraftProgress } from "@/features/budget-wizard/lib/wizard-state-from-budget";

/** After signing in from the wizard gate / login-with-returnTo, PUT once while draft exists. */
export function PersistBudgetAfterAuth() {
  const { session } = useWizardSession();
  const {
    saveServer,
    state,
    postLoginBudgetDraftSaveRequested,
    clearPostLoginBudgetDraftSaveRequest,
  } = useWizard();
  const attempted = useRef(false);

  useEffect(() => {
    if (!session) {
      attempted.current = false;
      return;
    }
    if (!postLoginBudgetDraftSaveRequested) return;
    if (attempted.current) return;
    if (!hasWizardDraftProgress(state)) {
      clearPostLoginBudgetDraftSaveRequest();
      return;
    }
    attempted.current = true;
    void (async () => {
      try {
        await saveServer();
        clearPostLoginBudgetDraftSaveRequest();
      } catch {
        attempted.current = false;
      }
    })();
  }, [
    session,
    saveServer,
    state,
    postLoginBudgetDraftSaveRequested,
    clearPostLoginBudgetDraftSaveRequest,
  ]);

  return null;
}
