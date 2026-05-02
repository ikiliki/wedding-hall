import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { EmailLoginForm } from "@/features/auth/components/EmailLoginForm";
import { createClient } from "@/shared/lib/supabase";

export function LoginPage() {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate("/dashboard", { replace: true });
        return;
      }
      setChecking(false);
    });
  }, [navigate]);

  if (checking) {
    return (
      <main className="flex min-h-dvh items-center justify-center text-sm text-muted">
        Loading…
      </main>
    );
  }

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm text-center">
        <p className="mb-4 text-xs uppercase tracking-luxe text-muted">
          Sign in
        </p>
        <h1 className="font-serif text-3xl">Welcome.</h1>
        <p className="mt-3 text-sm text-muted">
          Sign in with your email and password.
        </p>
        <div className="mt-10">
          <EmailLoginForm />
        </div>
        <p className="mt-8 text-xs text-muted">
          <Link to="/" className="underline-offset-4 hover:underline">
            Back home
          </Link>
        </p>
      </div>
    </main>
  );
}
