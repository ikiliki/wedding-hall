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
import * as styles from "./EmailLoginForm.styles";

// Dev-only convenience: pre-fill the seeded demo user when running locally.
// In production (any non-dev Vite build) the fields stay empty so the form
// looks like a real product, not a demo.
const DEFAULT_EMAIL = import.meta.env.DEV ? "test@gmail.com" : "";
const DEFAULT_PASSWORD = import.meta.env.DEV ? "test1234" : "";

type Mode = "signin" | "signup";

export function EmailLoginForm() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState(DEFAULT_EMAIL);
  const [password, setPassword] = useState(DEFAULT_PASSWORD);
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
      setEmail(DEFAULT_EMAIL);
      setPassword(DEFAULT_PASSWORD);
    }
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
      `Sent a password-reset link to ${email.trim()}. Open the email and pick a new password.`,
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
              "Signed in, but the server rejected your token. The client and the server are likely pointing at different Supabase projects — verify VITE_SUPABASE_URL on the client matches SUPABASE_URL on the server.",
          };
        }
        const detail =
          err.kind === "network"
            ? `Could not reach the server at ${err.message.replace(/^.*?at\s*/, "")}.`
            : `${err.message} (status ${err.status}).`;
        console.warn("upsertProfile via server failed (non-fatal)", err);
        return { kind: "warning", message: detail };
      }
      console.warn("upsertProfile via server failed (non-fatal, unknown)", err);
      return {
        kind: "warning",
        message: "Could not refresh your profile right now.",
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
      setErrorMsg("Enter a valid email address.");
      return;
    }
    if (password.length < 6) {
      setErrorMsg("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);
    const supabase = createClient();

    if (mode === "signup") {
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
            'Email rate limit hit. Turn OFF "Confirm email" in Supabase → Authentication → Providers → Email, then try again.',
          );
          return;
        }
        if (/already registered|user already exists|already.+exists/i.test(error.message)) {
          setShowSwitchToSignin(true);
          setErrorMsg(
            "This email already has an account. Sign in below, or send a password-reset link.",
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
          "This email already has an account. Sign in below, or send a password-reset link.",
        );
        return;
      }

      if (!data.session) {
        setLoading(false);
        setInfo(
          `Account created. Check ${trimmedEmail} for a confirmation link, then sign in.`,
        );
        return;
      }

      const profileResult = await ensureProfile();
      if (profileResult.kind === "tablesMissing") {
        setLoading(false);
        setErrorMsg(
          "Signed up, but the database tables are missing. Run supabase/seed.sql once, then click Sign in.",
        );
        return;
      }
      if (profileResult.kind === "blocker") {
        setLoading(false);
        setErrorMsg(profileResult.message);
        return;
      }
      const next = await getPostAuthPath(supabase);
      setLoading(false);
      navigate(next, { replace: true });
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
          "This account exists but its email is not confirmed. Open the confirmation email, or run supabase/seed.sql to seed a pre-confirmed demo user.",
        );
        return;
      }
      if (/invalid login credentials/i.test(error.message)) {
        setErrorMsg(
          'Wrong email or password. Tap "Sign up" to create a new account.',
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
        "Signed in, but the database tables are missing. Run supabase/seed.sql once, then refresh.",
      );
      return;
    }
    if (profileResult.kind === "blocker") {
      setLoading(false);
      setErrorMsg(profileResult.message);
      return;
    }
    const next = await getPostAuthPath(supabase);
    setLoading(false);
    navigate(next, { replace: true });
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
      {SERVER_URL_MISCONFIGURED && (
        <div className={styles.configBanner} role="alert">
          <strong>Setup needed:</strong> this build is missing
          <code> VITE_SERVER_URL</code>. Set it on the Vercel client project
          (e.g. <code>https://wedding-hall-server.vercel.app</code>) and
          redeploy — until then, sign-in will fail.
        </div>
      )}
      <div className={styles.tabs} role="tablist" aria-label="Sign in or sign up">
        <button
          type="button"
          role="tab"
          aria-selected={mode === "signin"}
          className={`${styles.tab} ${
            mode === "signin" ? styles.tabActive : styles.tabInactive
          }`}
          onClick={() => switchMode("signin")}
        >
          Sign in
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
          Sign up
        </button>
      </div>

      <div className={styles.field}>
        <label htmlFor="email" className={styles.label}>
          Email
        </label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          className={styles.input}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          required
          disabled={loading}
        />
      </div>

      <div className={styles.field}>
        <label htmlFor="password" className={styles.label}>
          Password
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
          <p className={styles.helper}>At least 6 characters.</p>
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
                Switch to sign in
              </button>
              <button
                type="button"
                className={styles.linkButton}
                onClick={handlePasswordReset}
              >
                Email me a reset link
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
            ? "Creating..."
            : "Signing in..."
          : mode === "signup"
            ? "Create account"
            : "Sign in"}
      </Button>
    </form>
  );
}

export default EmailLoginForm;
