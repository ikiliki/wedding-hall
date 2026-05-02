import { Navigate, Route, Routes } from "react-router-dom";
import { AuthCallbackPage } from "@/features/auth/pages/AuthCallbackPage";
import { LoginPage } from "@/features/auth/pages/LoginPage";
import { LandingPage } from "@/features/landing/pages/LandingPage";
import { WizardPage } from "@/features/budget-wizard/pages/WizardPage";
import { DashboardPage } from "@/features/dashboard/pages/DashboardPage";
import { BudgetPage } from "@/features/budget-view/pages/BudgetPage";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/auth/callback" element={<AuthCallbackPage />} />
      {/* New multi-step budget wizard. /start, /start/couple, /start/venue, ... */}
      <Route path="/start/*" element={<WizardPage />} />
      {/* Legacy onboarding URL → redirect into the new wizard. */}
      <Route path="/onboarding" element={<Navigate to="/start" replace />} />
      <Route path="/dashboard/*" element={<DashboardPage />} />
      <Route path="/budget" element={<BudgetPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
