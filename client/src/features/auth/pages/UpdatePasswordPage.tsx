import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/shared/components/Button";
import { createClient } from "@/shared/lib/supabase";
import * as loginStyles from "./LoginPage.styles";
import * as styles from "./UpdatePasswordPage.styles";

export function UpdatePasswordPage() {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    createClient()
      .auth.getSession()
      .then(({ data: { session } }) => {
        if (cancelled) return;
        if (!session) {
          navigate("/login", { replace: true });
          return;
        }
        setChecking(false);
      })
      .catch(() => {
        if (!cancelled) navigate("/login", { replace: true });
      });
    return () => {
      cancelled = true;
    };
  }, [navigate]);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrorMsg(null);
    const p = password.trim();
    const c = confirm.trim();
    if (p.length < 6) {
      setErrorMsg("הסיסמה חייבת להיות לפחות 6 תווים.");
      return;
    }
    if (p !== c) {
      setErrorMsg("שתי השדות אינן תואמות.");
      return;
    }
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password: p });
    setLoading(false);
    if (error) {
      setErrorMsg(error.message);
      return;
    }
    await supabase.auth.signOut();
    navigate("/login", { replace: true, state: { passwordUpdated: true } });
  }

  if (checking) {
    return <main className={loginStyles.checkingMain}>טוען…</main>;
  }

  return (
    <div className={loginStyles.root}>
      <div className={loginStyles.decoA} aria-hidden />
      <div className={loginStyles.decoB} aria-hidden />

      <main className={loginStyles.mainArea}>
        <div className={loginStyles.stack}>
          <div className={loginStyles.brandWrap}>
            <Link className={loginStyles.brandLink} to="/">
              <span className={loginStyles.brandIcon} aria-hidden>
                auto_awesome
              </span>
              <span className={loginStyles.brandWordmark}>Wedding Hall</span>
            </Link>
            <p className={styles.subtitle}>הגדרת סיסמה חדשה</p>
          </div>

          <form
            className={styles.form}
            onSubmit={handleSubmit}
            noValidate
            autoComplete="on"
          >
            <div className={styles.field}>
              <label htmlFor="new-password" className={styles.label}>
                סיסמה חדשה
              </label>
              <input
                id="new-password"
                type="password"
                autoComplete="new-password"
                className={styles.input}
                value={password}
                onChange={(ev) => setPassword(ev.target.value)}
                placeholder="••••••••"
                minLength={6}
                required
                disabled={loading}
              />
              <p className={styles.helper}>לפחות 6 תווים.</p>
            </div>

            <div className={styles.field}>
              <label htmlFor="confirm-password" className={styles.label}>
                חזרו על הסיסמה
              </label>
              <input
                id="confirm-password"
                type="password"
                autoComplete="new-password"
                className={styles.input}
                value={confirm}
                onChange={(ev) => setConfirm(ev.target.value)}
                placeholder="••••••••"
                minLength={6}
                required
                disabled={loading}
              />
            </div>

            {errorMsg && (
              <p className={styles.error} role="alert">
                {errorMsg}
              </p>
            )}

            <Button
              type="submit"
              variant="primary"
              fullWidth
              disabled={loading || password.length === 0 || confirm.length === 0}
            >
              {loading ? "שומרים…" : "עדכון סיסמה"}
            </Button>
          </form>

          <Link className={loginStyles.footerBack} to="/login">
            <span aria-hidden className="material-symbols-outlined">
              arrow_back
            </span>
            חזרה להתחברות
          </Link>
        </div>
      </main>
    </div>
  );
}

export default UpdatePasswordPage;
