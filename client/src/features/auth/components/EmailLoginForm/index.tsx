import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/shared/components/Button";
import {
  ApiError,
  SERVER_URL_MISCONFIGURED,
  upsertProfile,
} from "@/shared/lib/api";
import { createClient } from "@/shared/lib/supabase";
import { getPostAuthPath } from "@/shared/lib/post-auth-path";
import { WIZARD_POST_AUTH_SAVE_KEY } from "@/features/budget-wizard/lib/wizard-post-auth-save";
import { wizardResumePathMeansPostLoginSave } from "@/features/budget-wizard/lib/wizard-resume-flag";
import * as styles from "./EmailLoginForm.styles";

// Dev-only convenience: pre-fill the seeded demo user when running locally.
// In production (any non-dev Vite build) the fields stay empty so the form
// looks like a real product, not a demo.
const DEFAULT_EMAIL = import.meta.env.DEV ? "test@gmail.com" : "";
const DEFAULT_PASSWORD = import.meta.env.DEV ? "test1234" : "";

type Mode = "signin" | "signup";

export type EmailLoginFormProps = {
  /** Staff gate at `/admin`: sign-in only; after auth always returns to `/admin`. */
  variant?: "default" | "admin";
  /**
   * Sanitized wizard path (`/start/...`) from `?returnTo=` when user must
   * resume the budget flow after sign-in.
   */
  wizardResumePath?: string;
};

export function EmailLoginForm({
  variant = "default",
  wizardResumePath,
}: EmailLoginFormProps) {
  const navigate = useNavigate();
  const isAdminGate = variant === "admin";
  const devPrefillEmail = import.meta.env.DEV
    ? isAdminGate
      ? "admin@weddinghall.app"
      : DEFAULT_EMAIL
    : "";
  const devPrefillPassword = import.meta.env.DEV
    ? isAdminGate
      ? "Admin!2026"
      : DEFAULT_PASSWORD
    : "";
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState(devPrefillEmail);
  const [password, setPassword] = useState(devPrefillPassword);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  // When set, the inline error gets a "Switch to sign in" action button.
  const [showSwitchToSignin, setShowSwitchToSignin] = useState(false);

  function switchMode(next: Mode) {
    if (next === mode) return;
    setMode(next);
    setErrorMsg(null);
    setInfo(null);
    setShowSwitchToSignin(false);
    if (next === "signup") {
      setEmail("");
      setPassword("");
    } else {
      setEmail(devPrefillEmail);
      setPassword(devPrefillPassword);
    }
  }

  async function postAuthNavigate(supabase: ReturnType<typeof createClient>) {
    const next = isAdminGate
      ? "/admin"
      : (wizardResumePath ?? (await getPostAuthPath(supabase)));
    if (
      !isAdminGate &&
      typeof window !== "undefined" &&
      wizardResumePathMeansPostLoginSave(wizardResumePath)
    ) {
      window.sessionStorage.setItem(WIZARD_POST_AUTH_SAVE_KEY, "1");
    }
    navigate(next, { replace: true });
  }

  async function handlePasswordReset() {
    setErrorMsg(null);
    setInfo(null);
    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/auth/callback`,
    });
    if (error) {
      setErrorMsg(error.message);
      return;
    }
    setInfo(
      `שלחנו קישור לאיפוס סיסמה ל-${email.trim()}. פתחו את המייל ובחרו סיסמה חדשה.`,
    );
  }

  // Result of the post-auth `POST /api/profiles` round-trip.
  //
  //   tablesMissing — the Supabase project hasn't had schema.sql applied
  //                   yet; the user can't proceed until it's fixed.
  //   blockerMsg    — anything else that *should* be surfaced (only
  //                   `unauthorized` qualifies, because that means the
  //                   server is talking to a different Supabase project
  //                   than the client and nothing else will work either).
  //   warning       — non-fatal: the DB trigger already created the
  //                   profile row, so a transient network/CORS hiccup
  //                   shouldn't block sign-in. We just log + continue.
  type ProfileResult =
    | { kind: "ok" }
    | { kind: "tablesMissing" }
    | { kind: "blocker"; message: string }
    | { kind: "warning"; message: string };

  async function ensureProfile(): Promise<ProfileResult> {
    try {
      await upsertProfile();
      return { kind: "ok" };
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.kind === "tables_missing") return { kind: "tablesMissing" };
        if (err.kind === "unauthorized") {
          return {
            kind: "blocker",
            message:
              "נכנסתם בהצלחה, אבל השרת דחה את האסימון. ייתכן שהאפליקציה והשרת מצביעים על פרויקטי Supabase שונים — ודאו ש-VITE_SUPABASE_URL אצל הקליינט תואם ל-SUPABASE_URL אצל השרת.",
          };
        }
        const detail =
          err.kind === "network"
            ? `לא ניתן להגיע לשרת (${err.message.replace(/^.*?at\s*/, "")}).`
            : `${err.message} (קוד ${err.status}).`;
        console.warn("upsertProfile via server failed (non-fatal)", err);
        return { kind: "warning", message: detail };
      }
      console.warn("upsertProfile via server failed (non-fatal, unknown)", err);
      return {
        kind: "warning",
        message: "לא ניתן לרענן את הפרופיל כרגע.",
      };
    }
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrorMsg(null);
    setInfo(null);
    setShowSwitchToSignin(false);

    const trimmedEmail = email.trim();
    if (!trimmedEmail || !/.+@.+\..+/.test(trimmedEmail)) {
      setErrorMsg("נא למלא כתובת אימייל תקינה.");
      return;
    }
    if (password.length < 6) {
      setErrorMsg("הסיסמה חייבת להיות לפחות 6 תווים.");
      return;
    }

    setLoading(true);
    const supabase = createClient();

    if (!isAdminGate && mode === "signup") {
      const { data, error } = await supabase.auth.signUp({
        email: trimmedEmail,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        setLoading(false);
        if (/email rate limit/i.test(error.message)) {
          setErrorMsg(
            'הגעתם למגבלת קצב שליחת מיילים. כבו את "אימות אימייל" ב-Supabase ← Authentication ← Providers ← Email, ונסו שוב.',
          );
          return;
        }
        if (/already registered|user already exists|already.+exists/i.test(error.message)) {
          setShowSwitchToSignin(true);
          setErrorMsg(
            "לאימייל זה כבר יש חשבון. התחברו למטה, או בקשו קישור לאיפוס סיסמה.",
          );
          return;
        }
        setErrorMsg(error.message);
        return;
      }

      // Some Supabase configurations return a fake user with no identities
      // when the email is taken (instead of a hard error). Detect that.
      const identities = data.user?.identities;
      if (data.user && Array.isArray(identities) && identities.length === 0) {
        setLoading(false);
        setShowSwitchToSignin(true);
        setErrorMsg(
          "לאימייל זה כבר יש חשבון. התחברו למטה, או בקשו קישור לאיפוס סיסמה.",
        );
        return;
      }

      if (!data.session) {
        setLoading(false);
        setInfo(
          `החשבון נוצר. בדקו את ${trimmedEmail} לקבלת קישור אימות, ואז התחברו.`,
        );
        return;
      }

      const profileResult = await ensureProfile();
      if (profileResult.kind === "tablesMissing") {
        setLoading(false);
        setErrorMsg(
          "נרשמתם בהצלחה, אבל טבלאות המסד נעדרות. הריצו פעם אחת את supabase/seed.sql ואז לחצו על התחברות.",
        );
        return;
      }
      if (profileResult.kind === "blocker") {
        setLoading(false);
        setErrorMsg(profileResult.message);
        return;
      }
      await postAuthNavigate(supabase);
      setLoading(false);
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({
      email: trimmedEmail,
      password,
    });

    if (error) {
      setLoading(false);
      if (/email not confirmed/i.test(error.message)) {
        setErrorMsg(
          "לחשבון זה קיים אימייל שלא אומת. פתחו את מייל האימות, או הריצו supabase/seed.sql ליצירת משתמש דמו מאומת מראש.",
        );
        return;
      }
      if (/invalid login credentials/i.test(error.message)) {
        setErrorMsg(
          isAdminGate
            ? "אימייל או סיסמה שגויים."
            : 'אימייל או סיסמה שגויים. אם אין לכם חשבון — עברו ללשונית "הרשמה חדשה".',
        );
        return;
      }
      setErrorMsg(error.message);
      return;
    }

    const profileResult = await ensureProfile();
    if (profileResult.kind === "tablesMissing") {
      setLoading(false);
      setErrorMsg(
        "נכנסתם בהצלחה, אבל טבלאות המסד נעדרות. הריצו פעם אחת את supabase/seed.sql ואז רעננו.",
      );
      return;
    }
    if (profileResult.kind === "blocker") {
      setLoading(false);
      setErrorMsg(profileResult.message);
      return;
    }
    await postAuthNavigate(supabase);
    setLoading(false);
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
      {SERVER_URL_MISCONFIGURED && (
        <div className={styles.configBanner} role="alert">
          <strong>נדרשת הגדרה:</strong> לבנייה זו חסר{" "}
          <code>VITE_SERVER_URL</code>. הגדירו אותו בפרויקט הלקוח ב-Vercel
          (למשל <code>https://wedding-hall-server.vercel.app</code>) ופרסמו
          מחדש — עד אז ההתחברות לא תצליח.
        </div>
      )}
      {!isAdminGate && (
        <div className={styles.tabs} role="tablist" aria-label="כניסה או הרשמה">
          <button
            type="button"
            role="tab"
            aria-selected={mode === "signin"}
            className={`${styles.tab} ${
              mode === "signin" ? styles.tabActive : styles.tabInactive
            }`}
            onClick={() => switchMode("signin")}
          >
            כניסה למערכת
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === "signup"}
            className={`${styles.tab} ${
              mode === "signup" ? styles.tabActive : styles.tabInactive
            }`}
            onClick={() => switchMode("signup")}
          >
            הרשמה חדשה
          </button>
        </div>
      )}

      <div className={styles.field}>
        <label htmlFor="email" className={styles.label}>
          כתובת אימייל
        </label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          className={styles.input}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={isAdminGate ? "admin@example.co.il" : "name@domain.co.il"}
          required
          disabled={loading}
        />
      </div>

      <div className={styles.field}>
        <label htmlFor="password" className={styles.label}>
          סיסמה
        </label>
        <input
          id="password"
          type="password"
          autoComplete={
            mode === "signup" ? "new-password" : "current-password"
          }
          className={styles.input}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          required
          disabled={loading}
          minLength={6}
        />
        {mode === "signup" && (
          <p className={styles.helper}>לפחות 6 תווים.</p>
        )}
      </div>

      {errorMsg && (
        <div className={styles.errorBlock}>
          <p className={styles.error} role="alert">
            {errorMsg}
          </p>
          {showSwitchToSignin && (
            <div className={styles.errorActions}>
              <button
                type="button"
                className={styles.linkButton}
                onClick={() => switchMode("signin")}
              >
                עברו להתחברות
              </button>
              <button
                type="button"
                className={styles.linkButton}
                onClick={handlePasswordReset}
              >
                שלחו לי קישור לאיפוס
              </button>
            </div>
          )}
        </div>
      )}

      {info && (
        <p className={styles.success} role="status">
          {info}
        </p>
      )}

      <Button
        type="submit"
        variant="primary"
        fullWidth
        disabled={loading || email.trim().length === 0 || password.length === 0}
      >
        {loading
          ? mode === "signup"
            ? "יוצרים חשבון…"
            : "מתחברים…"
          : mode === "signup"
            ? "פתיחת חשבון"
            : "התחברות"}
      </Button>
    </form>
  );
}

export default EmailLoginForm;
