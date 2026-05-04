import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { EmailLoginForm } from "@/features/auth/components/EmailLoginForm";
import { createClient } from "@/shared/lib/supabase";
import { getPostAuthPath } from "@/shared/lib/post-auth-path";
import type { LoginRouterState } from "@/features/auth/lib/login-router-state";
import { wizardPostLoginNavState } from "@/features/budget-wizard/lib/wizard-resume-flag";
import { safeWizardReturnPath } from "@/shared/lib/safe-return-path";
import * as styles from "./LoginPage.styles";

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const wizardResumePath =
    safeWizardReturnPath(searchParams.get("returnTo")) ?? undefined;
  const [checking, setChecking] = useState(true);
  const refreshedPassword = Boolean(
    (location.state as LoginRouterState | null)?.passwordUpdated,
  );
  const [showPasswordBanner, setShowPasswordBanner] = useState(refreshedPassword);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session) {
        const next = wizardResumePath ?? (await getPostAuthPath(supabase));
        const rs = wizardPostLoginNavState(wizardResumePath);
        navigate(next, {
          replace: true,
          ...(rs !== undefined ? { state: rs } : {}),
        });
        return;
      }
      setChecking(false);
    });
  }, [navigate, wizardResumePath]);

  useEffect(() => {
    setShowPasswordBanner(refreshedPassword);
  }, [refreshedPassword]);

  useEffect(() => {
    if (!showPasswordBanner) return;
    const t = window.setTimeout(() => setShowPasswordBanner(false), 10_000);
    return () => window.clearTimeout(t);
  }, [showPasswordBanner]);

  if (checking) {
    return <main className={styles.checkingMain}>טוען…</main>;
  }

  return (
    <div className={styles.root}>
      <div className={styles.decoA} aria-hidden />
      <div className={styles.decoB} aria-hidden />

      <main className={styles.mainArea}>
        <div className={styles.stack}>
          <div className={styles.brandWrap}>
            <Link className={styles.brandLink} to="/">
              <span className={styles.brandIcon} aria-hidden>
                auto_awesome
              </span>
              <span className={styles.brandWordmark}>Wedding Hall</span>
            </Link>
            <p className={styles.brandTagline}>
              מנהלים את התקציב שלכם בשקט ובביטחון בדרך אל היום הגדול.
            </p>
          </div>

          <div className={styles.formWrap}>
            {showPasswordBanner ? (
              <p className={styles.bannerSuccess} role="status">
                הסיסמה עודכנה. התחברו עם האימייל והסיסמה החדשה.
              </p>
            ) : null}
            <EmailLoginForm wizardResumePath={wizardResumePath} />
          </div>

          <Link className={styles.footerBack} to="/">
            <span aria-hidden className="material-symbols-outlined">
              arrow_back
            </span>
            חזרה לדף הבית
          </Link>
        </div>
      </main>
    </div>
  );
}

export default LoginPage;
