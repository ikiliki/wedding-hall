import { useEffect, useRef } from "react";
import { useWizardSession } from "@/features/budget-wizard/state/wizard-session-context";
import { useWizard } from "@/features/budget-wizard/state/use-wizard";
import { hasWizardDraftProgress } from "@/features/budget-wizard/lib/wizard-state-from-budget";
import { WIZARD_POST_AUTH_SAVE_KEY } from "@/features/budget-wizard/lib/wizard-post-auth-save";

/** After signing in from the wizard gate / login-with-returnTo, PUT once while draft exists. */
export function PersistBudgetAfterAuth() {
  const { session } = useWizardSession();
  const { saveServer, state } = useWizard();
  const attempted = useRef(false);

  useEffect(() => {
    if (!session) {
      attempted.current = false;
      return;
    }
    if (typeof window === "undefined") return;
    if (window.sessionStorage.getItem(WIZARD_POST_AUTH_SAVE_KEY) !== "1") return;
    if (attempted.current) return;
    if (!hasWizardDraftProgress(state)) {
      window.sessionStorage.removeItem(WIZARD_POST_AUTH_SAVE_KEY);
      return;
    }
    attempted.current = true;
    void (async () => {
      try {
        await saveServer();
        window.sessionStorage.removeItem(WIZARD_POST_AUTH_SAVE_KEY);
      } catch {
        attempted.current = false;
        window.sessionStorage.setItem(WIZARD_POST_AUTH_SAVE_KEY, "1");
      }
    })();
  }, [session, saveServer, state]);

  return null;
}
