import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { createClient } from "@/shared/lib/supabase";
import { getPostAuthPath } from "@/shared/lib/post-auth-path";

export function AuthCallbackPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const code = searchParams.get("code");
    if (!code) {
      navigate("/login", { replace: true });
      return;
    }

    const authCode = code;
    let cancelled = false;

    async function run() {
      const supabase = createClient();
      const { error } = await supabase.auth.exchangeCodeForSession(authCode);

      if (cancelled) return;

      if (error) {
        console.error("auth/callback exchange error", error);
        navigate("/login", { replace: true });
        return;
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        navigate("/login", { replace: true });
        return;
      }

      const fullName =
        (user.user_metadata?.full_name as string | undefined) ??
        (user.user_metadata?.name as string | undefined) ??
        null;

      await supabase.from("profiles").upsert(
        {
          id: user.id,
          email: user.email ?? null,
          full_name: fullName,
        },
        { onConflict: "id" },
      );

      const next = await getPostAuthPath(supabase);
      if (cancelled) return;
      navigate(next, { replace: true });
    }

    run().catch(() => {
      if (!cancelled) {
        navigate("/login", { replace: true });
      }
    });

    return () => {
      cancelled = true;
    };
  }, [searchParams, navigate]);

  return (
    <main className="flex min-h-dvh items-center justify-center px-6 text-sm text-muted">
      Signing you in…
    </main>
  );
}
