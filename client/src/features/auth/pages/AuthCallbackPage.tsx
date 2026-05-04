import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { upsertProfile } from "@/shared/lib/api";
import { createClient } from "@/shared/lib/supabase";
import { getPostAuthPath } from "@/shared/lib/post-auth-path";

/** PKCE redirect metadata from `@supabase/auth-js` exchange (recovery vs sign-in). */
function exchangeRedirectType(data: unknown): string | undefined {
  if (data && typeof data === "object" && "redirectType" in data) {
    const v = (data as { redirectType?: unknown }).redirectType;
    return typeof v === "string" ? v : undefined;
  }
  return undefined;
}

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
      const exchange = await supabase.auth.exchangeCodeForSession(authCode);

      if (cancelled) return;

      if (exchange.error) {
        console.error("auth/callback exchange error", exchange.error);
        navigate("/login", { replace: true });
        return;
      }

      if (exchangeRedirectType(exchange.data) === "recovery") {
        navigate("/auth/update-password", { replace: true });
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

      try {
        await upsertProfile({ email: user.email ?? null, full_name: fullName });
      } catch (err) {
        // Don't block the sign-in flow on a profile upsert hiccup —
        // the dashboard / onboarding will surface a real error if needed.
        console.error("auth/callback upsertProfile error", err);
      }

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
    <main className="wh-page-center-muted">
      מתחברים…
    </main>
  );
}
