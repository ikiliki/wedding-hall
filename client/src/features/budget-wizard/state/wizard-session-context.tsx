import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { Session } from "@supabase/supabase-js";
import { createClient } from "@/shared/lib/supabase";

export type WizardSessionValue = {
  session: Session | null;
  loading: boolean;
};

const WizardSessionContext = createContext<WizardSessionValue | null>(null);

export function WizardSessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    let cancelled = false;

    supabase.auth.getSession().then(({ data: { session: s } }) => {
      if (cancelled) return;
      setSession(s);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, s) => {
      if (cancelled) return;
      setSession(s);
      setLoading(false);
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  const value: WizardSessionValue = { session, loading };

  return (
    <WizardSessionContext.Provider value={value}>
      {children}
    </WizardSessionContext.Provider>
  );
}

// Hook is intentionally colocated — only the wizard / Storybook tree mounts this provider.
/* eslint-disable react-refresh/only-export-components -- see note above */
export function useWizardSession(): WizardSessionValue {
  const ctx = useContext(WizardSessionContext);
  if (!ctx) {
    throw new Error(
      "useWizardSession must be used under <WizardSessionProvider>.",
    );
  }
  return ctx;
}
/* eslint-enable react-refresh/only-export-components */
