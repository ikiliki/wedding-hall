"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/Button";
import { createClient } from "@/lib/supabase/client";
import * as styles from "./EmailLoginForm.styles";

// MVP demo credentials. Pre-filled so testers can sign in with one click.
// Remove or rotate before going to real production.
const DEFAULT_EMAIL = "test@gmail.com";
const DEFAULT_PASSWORD = "test1234";

export function EmailLoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState(DEFAULT_EMAIL);
  const [password, setPassword] = useState(DEFAULT_PASSWORD);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrorMsg(null);

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

    let { error } = await supabase.auth.signInWithPassword({
      email: trimmedEmail,
      password,
    });

    if (error && /invalid login credentials/i.test(error.message)) {
      const { error: signUpError } = await supabase.auth.signUp({
        email: trimmedEmail,
        password,
      });
      if (signUpError) {
        setLoading(false);
        setErrorMsg(signUpError.message);
        return;
      }
      ({ error } = await supabase.auth.signInWithPassword({
        email: trimmedEmail,
        password,
      }));
    }

    if (error) {
      setLoading(false);
      setErrorMsg(error.message);
      return;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      await supabase.from("profiles").upsert(
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
    }

    router.push("/onboarding");
    router.refresh();
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
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
          autoComplete="current-password"
          className={styles.input}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
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
        disabled={loading || email.trim().length === 0 || password.length === 0}
      >
        {loading ? "Signing in..." : "Sign in"}
      </Button>
    </form>
  );
}

export default EmailLoginForm;
