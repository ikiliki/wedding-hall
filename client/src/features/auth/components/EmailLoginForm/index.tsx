import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/shared/components/Button";
import { createClient } from "@/shared/lib/supabase";
import { getPostAuthPath } from "@/shared/lib/post-auth-path";
import * as styles from "./EmailLoginForm.styles";

const DEFAULT_EMAIL = "test@gmail.com";
const DEFAULT_PASSWORD = "test1234";

type Mode = "signin" | "signup";

export function EmailLoginForm() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState(DEFAULT_EMAIL);
  const [password, setPassword] = useState(DEFAULT_PASSWORD);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  function switchMode(next: Mode) {
    if (next === mode) return;
    setMode(next);
    setErrorMsg(null);
    setInfo(null);
    if (next === "signup") {
      setEmail("");
      setPassword("");
    } else {
      setEmail(DEFAULT_EMAIL);
      setPassword(DEFAULT_PASSWORD);
    }
  }

  async function upsertProfile(): Promise<{ tablesMissing: boolean }> {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { tablesMissing: false };
    const { error } = await supabase.from("profiles").upsert(
      {
        id: user.id,
        email: user.email ?? null,
        full_name:
          (user.user_metadata?.full_name as string | undefined) ??
          (user.user_metadata?.name as string | undefined) ??
          null,
      },
      { onConflict: "id" },
    );
    if (
      error &&
      (error.code === "42P01" ||
        /relation .* does not exist/i.test(error.message))
    ) {
      return { tablesMissing: true };
    }
    return { tablesMissing: false };
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrorMsg(null);
    setInfo(null);

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
            'Email rate limit hit. Turn OFF "Confirm email" in Supabase -> Authentication -> Providers -> Email, then try again. (No emails will be sent and signup is instant.)',
          );
          return;
        }
        if (/already registered|user already exists/i.test(error.message)) {
          setErrorMsg(
            'That email already has an account. Switch to "Sign in".',
          );
          return;
        }
        setErrorMsg(error.message);
        return;
      }

      if (!data.session) {
        setLoading(false);
        setInfo(
          `Account created. Supabase requires email confirmation - check the inbox for ${trimmedEmail}, then come back and sign in. (To skip: turn OFF "Confirm email" in Supabase Auth -> Providers -> Email.)`,
        );
        return;
      }

      const { tablesMissing } = await upsertProfile();
      setLoading(false);
      if (tablesMissing) {
        setErrorMsg(
          "Signed up, but the database tables are missing. Open Supabase -> SQL Editor and run supabase/seed.sql once, then click Sign in.",
        );
        return;
      }
      const next = await getPostAuthPath(supabase);
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
          "This account exists but its email is not confirmed. Confirm it from the inbox, or run supabase/seed.sql to seed a pre-confirmed demo user.",
        );
        return;
      }
      if (/invalid login credentials/i.test(error.message)) {
        setErrorMsg(
          'No account found, or wrong password. For the demo user, run supabase/seed.sql in Supabase. Or tap "Sign up" to create a new account.',
        );
        return;
      }
      setErrorMsg(error.message);
      return;
    }

    const { tablesMissing } = await upsertProfile();
    setLoading(false);
    if (tablesMissing) {
      setErrorMsg(
        "Signed in, but the database tables are missing. Open Supabase -> SQL Editor and run supabase/seed.sql once, then refresh.",
      );
      return;
    }
    const next = await getPostAuthPath(supabase);
    navigate(next, { replace: true });
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
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
        <p className={styles.error} role="alert">
          {errorMsg}
        </p>
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
