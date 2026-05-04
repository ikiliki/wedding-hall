/**
 * After login-from-wizard, `EmailLoginForm` passes this on `navigate(..., { state })`.
 * WizardProvider reads it once on first mount — no sessionStorage flag.
 */
export type WizardPostLoginRouterState = {
  whPostWizardSaveDraft?: boolean;
};
