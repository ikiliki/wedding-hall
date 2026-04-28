"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/Button";
import { createClient } from "@/lib/supabase/client";
import * as styles from "./EmailLoginForm.styles";

export function EmailLoginForm() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrorMsg(null);
    setSent(false);

    const trimmed = email.trim();
    if (!trimmed || !/.+@.+\..+/.test(trimmed)) {
      setErrorMsg("Enter a valid email address.");
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email: trimmed,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    setLoading(false);

    if (error) {
      setErrorMsg(error.message);
      return;
    }

    setSent(true);
  }

  if (sent) {
    return (
      <div className={styles.success} role="status" aria-live="polite">
        Check your inbox. We sent a sign-in link to <strong>{email}</strong>.
      </div>
    );
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

      {errorMsg && (
        <p className={styles.error} role="alert">
          {errorMsg}
        </p>
      )}

      <Button
        type="submit"
        variant="primary"
        fullWidth
        disabled={loading || email.trim().length === 0}
      >
        {loading ? "Sending..." : "Send sign-in link"}
      </Button>
    </form>
  );
}

export default EmailLoginForm;
