import { redirect } from "next/navigation";
import Link from "next/link";
import { EmailLoginForm } from "@/components/EmailLoginForm";
import { createClient } from "@/lib/supabase/server";

export default async function LoginPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/dashboard");
  }

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm text-center">
        <p className="mb-4 text-xs uppercase tracking-luxe text-muted">
          Sign in
        </p>
        <h1 className="font-serif text-3xl">Welcome.</h1>
        <p className="mt-3 text-sm text-muted">
          Enter your email. We&apos;ll send you a sign-in link.
        </p>
        <div className="mt-10">
          <EmailLoginForm />
        </div>
        <p className="mt-8 text-xs text-muted">
          <Link href="/" className="underline-offset-4 hover:underline">
            Back home
          </Link>
        </p>
      </div>
    </main>
  );
}
