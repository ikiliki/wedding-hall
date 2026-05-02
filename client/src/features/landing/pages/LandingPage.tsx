import { useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/shared/components/Button";

export function LandingPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const code = searchParams.get("code");
    if (code) {
      navigate(`/auth/callback?code=${encodeURIComponent(code)}`, {
        replace: true,
      });
    }
  }, [searchParams, navigate]);

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-6 text-center">
      <p className="mb-6 text-xs uppercase tracking-luxe text-muted">
        Wedding Hall
      </p>
      <h1 className="font-serif text-5xl leading-tight sm:text-6xl">
        Plan your wedding,
        <br />
        quietly.
      </h1>
      <p className="mt-6 max-w-md text-base text-muted">
        Estimate your venue budget in under a minute.
      </p>
      <div className="mt-12 w-full max-w-xs">
        <Link
          to="/login"
          aria-label="Get started"
          className="block w-full max-w-xs"
        >
          <Button variant="primary" fullWidth>
            Get started
          </Button>
        </Link>
      </div>
    </main>
  );
}
