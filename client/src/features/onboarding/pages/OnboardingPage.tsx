import { Navigate } from "react-router-dom";

// Legacy route. The real flow now lives at /start under
// `client/src/features/budget-wizard/`. We keep this page so any
// bookmark or stale link still lands somewhere sensible.
export function OnboardingPage() {
  return <Navigate to="/start" replace />;
}

export default OnboardingPage;
