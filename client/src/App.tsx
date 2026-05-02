import { Navigate, Route, Routes } from "react-router-dom";
import { AuthCallbackPage } from "@/features/auth/pages/AuthCallbackPage";
import { DashboardPage } from "@/features/dashboard/pages/DashboardPage";
import { LandingPage } from "@/features/landing/pages/LandingPage";
import { LoginPage } from "@/features/auth/pages/LoginPage";
import { OnboardingPage } from "@/features/onboarding/pages/OnboardingPage";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/auth/callback" element={<AuthCallbackPage />} />
      <Route path="/onboarding" element={<OnboardingPage />} />
      <Route path="/dashboard" element={<DashboardPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
