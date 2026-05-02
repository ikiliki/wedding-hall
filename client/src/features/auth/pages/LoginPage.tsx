import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { EmailLoginForm } from "@/features/auth/components/EmailLoginForm";
import { createClient } from "@/shared/lib/supabase";
import { getPostAuthPath } from "@/shared/lib/post-auth-path";
import * as styles from "./LoginPage.styles";

export function LoginPage() {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session) {
        const next = await getPostAuthPath(supabase);
        navigate(next, { replace: true });
        return;
      }
      setChecking(false);
    });
  }, [navigate]);

  if (checking) {
    return (
      <main className={styles.checkingMain}>Loading…</main>
    );
  }

  return (
    <main className={styles.root}>
      <div className={styles.spotlight} aria-hidden />

      <header className={styles.header}>
        <Link to="/" className={styles.brand}>
          Wedding Hall
        </Link>
        <Link to="/" className={styles.back}>
          Back home
        </Link>
      </header>

      <section className={styles.body}>
        <div className={styles.copyCol}>
          <p className={styles.eyebrow}>Sign in</p>
          <h1 className={styles.title}>Welcome back.</h1>
          <p className={styles.lede}>
            Pick up where you left off. Your wedding budget is saved to
            your account, so you can continue from any device.
          </p>
        </div>

        <div className={styles.formCol}>
          <div className={styles.formCard}>
            <EmailLoginForm />
          </div>
        </div>
      </section>
    </main>
  );
}
