import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { EmailLoginForm } from "@/features/auth/components/EmailLoginForm";
import { createClient } from "@/shared/lib/supabase";
import { getPostAuthPath } from "@/shared/lib/post-auth-path";
import { safeWizardReturnPath } from "@/shared/lib/safe-return-path";
import * as styles from "./LoginPage.styles";

export function LoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const wizardResumePath =
    safeWizardReturnPath(searchParams.get("returnTo")) ?? undefined;
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session) {
        const next = wizardResumePath ?? (await getPostAuthPath(supabase));
        navigate(next, { replace: true });
        return;
      }
      setChecking(false);
    });
  }, [navigate, wizardResumePath]);
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
