import Link from "next/link";
import { Button } from "@/components/Button";

export default function LandingPage() {
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
        <Link href="/login" aria-label="Get started">
          <Button variant="primary" fullWidth>
            Get started
          </Button>
        </Link>
      </div>
    </main>
  );
}
