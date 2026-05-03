import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { EmailLoginForm } from "@/features/auth/components/EmailLoginForm";
import { ApiError, upsertProfile } from "@/shared/lib/api";
import * as buttonStyles from "@/shared/components/Button/Button.styles";
import { LogoutButton } from "@/shared/components/LogoutButton";
import { createClient } from "@/shared/lib/supabase";
import * as styles from "./AdminGate.styles";

type Props = { children: React.ReactNode };

type GateState = "loading" | "need_login" | "ok" | "denied";

// `/admin` entry: sign-in happens on this URL. After Supabase auth succeeds,
// we call `POST /api/profiles` (upsertProfile) and only allow the shell when
// `profiles.is_admin` is true. Non-admins stay on the page with a clear
// message (no Postgres reads from the browser — same server path as the rest
// of the app).
export function AdminGate({ children }: Props) {
  const [state, setState] = useState<GateState>("loading");

  useEffect(() => {
    let cancelled = false;
    const supabase = createClient();

    async function runCheck() {
      setState("loading");
      const { data } = await supabase.auth.getSession();
      if (cancelled) return;

      if (!data.session) {
        setState("need_login");
        return;
      }

      try {
        const profile = await upsertProfile();
        if (cancelled) return;
        if (profile?.is_admin) {
          setState("ok");
        } else {
          setState("denied");
        }
      } catch (err) {
        if (cancelled) return;
        if (err instanceof ApiError && err.kind === "unauthorized") {
          setState("need_login");
          return;
        }
        setState("denied");
      }
    }

    void runCheck();

    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (cancelled) return;
      if (
        event === "SIGNED_IN" ||
        event === "SIGNED_OUT" ||
        event === "USER_UPDATED"
      ) {
        void runCheck();
      }
    });

    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, []);

  if (state === "loading") {
    return (
      <main className={styles.checkingMain}>בודקים הרשאות…</main>
    );
  }

  if (state === "need_login") {
    return (
      <main className={styles.root}>
        <div className={styles.spotlight} aria-hidden />

        <header className={styles.header}>
          <Link to="/" className={styles.brand}>
            Wedding Hall
          </Link>
          <Link to="/login" className={styles.back}>
            התחברות רגילה
          </Link>
        </header>

        <section className={styles.body}>
          <div className={styles.copyCol}>
            <p className={styles.eyebrow}>ניהול מערכת</p>
            <h1 className={styles.title}>כניסת צוות</h1>
            <p className={styles.lede}>
              משתמשים באותו אימייל וסיסמה כמו בחשבון Wedding Hall שלכם.
              רק משתמשים עם הרשאת מנהל במסד הנתונים יכולים להיכנס לאזור זה.
            </p>
          </div>

          <div className={styles.formCol}>
            <div className={styles.formCard}>
              <EmailLoginForm variant="admin" />
            </div>
          </div>
        </section>
      </main>
    );
  }

  if (state === "denied") {
    return (
      <main className={styles.deniedMain}>
        <div>
          <p className={styles.deniedTitle}>
            לחשבון זה אין הרשאות ניהול.
          </p>
          <p className="wh-mt-2">
            אם נדרשת גישה, פנו למנהל המערכת של Wedding Hall.
          </p>
        </div>
        <div className={styles.deniedActions}>
          <Link
            to="/dashboard"
            className={`${buttonStyles.base} ${buttonStyles.sizeMd} ${buttonStyles.secondary}`}
          >
            אל לוח הבקרה שלכם
          </Link>
          <LogoutButton redirectAfterLogout="/admin" />
        </div>
      </main>
    );
  }

  return <>{children}</>;
}

export default AdminGate;
