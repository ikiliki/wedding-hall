import { useContext } from "react";
import { WizardContext, type Ctx } from "./wizard-types";

export function useWizard(): Ctx {
  const ctx = useContext(WizardContext);
  if (!ctx) {
    throw new Error("useWizard must be used inside <WizardProvider>");
  }
  return ctx;
}
