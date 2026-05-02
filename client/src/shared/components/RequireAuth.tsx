import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { createClient } from "@/shared/lib/supabase";

type Props = { children: React.ReactNode };

export function RequireAuth({ children }: Props) {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    let cancelled = false;

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (cancelled) return;
      if (!session) {
        navigate("/login", { replace: true });
        return;
      }
      setAuthed(true);
      setReady(true);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (cancelled) return;
      if (!session) {
        navigate("/login", { replace: true });
        return;
      }
      setAuthed(true);
      setReady(true);
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [navigate]);

  if (!ready || !authed) {
    return (
      <main className="flex min-h-dvh items-center justify-center px-6 text-sm text-muted">
        Loading…
      </main>
    );
  }

  return <>{children}</>;
}
