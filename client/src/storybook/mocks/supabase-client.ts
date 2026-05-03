/** Supabase shim for Storybook only (see `.storybook/main.ts` vite alias). */

import type { Session, SupabaseClient, User } from "@supabase/supabase-js";

export const MOCK_STORYBOOK_USER_EMAIL = "storybook@example.com";

export const MOCK_STORYBOOK_USER_ID = "11111111-1111-1111-1111-111111111111";

const storyUser = {
  id: MOCK_STORYBOOK_USER_ID,
  aud: "authenticated",
  role: "authenticated",
  email: MOCK_STORYBOOK_USER_EMAIL,
  phone: "",
  app_metadata: {},
  user_metadata: {},
  identities: [],
  created_at: "2026-01-01T00:00:00.000Z",
  updated_at: "2026-01-01T00:00:00.000Z",
  is_anonymous: false,
  factors: [],
} as unknown as User;

/** Session used when decorators set `parameters.auth = "loggedIn"`. */
export const loggedInSession: Session = {
  access_token: "storybook-mock-access-token",
  refresh_token: "storybook-mock-refresh",
  expires_in: 3600,
  expires_at: Math.floor(Date.now() / 1000) + 3600,
  token_type: "bearer",
  user: storyUser,
};

class StorybookAuth {
  session: Session | null = null;
  listeners = new Map<
    symbol,
    (event: string, session: Session | null) => void | Promise<void>
  >();

  setSession(next: Session | null): void {
    this.session = next;
    this.listeners.forEach((callback) => {
      void Promise.resolve(callback("SESSION_UPDATE", next));
    });
  }

  onAuthStateChange(
    callback: (event: string, session: Session | null) => void | Promise<void>,
  ): { data: { subscription: { unsubscribe: () => void } } } {
    const key = Symbol();
    this.listeners.set(key, callback);
    return {
      data: {
        subscription: {
          unsubscribe: () => {
            this.listeners.delete(key);
          },
        },
      },
    };
  }

  async getSession(): Promise<{
    data: { session: Session | null };
    error: null;
  }> {
    return { data: { session: this.session }, error: null };
  }

  async getUser(): Promise<{ data: { user: User | null }; error: null }> {
    const user = this.session?.user ?? null;
    return { data: { user }, error: null };
  }

  async signOut(): Promise<{ error: null }> {
    this.setSession(null);
    return { error: null };
  }

  async signInWithPassword(creds: {
    email: string;
    password?: string | undefined;
  }): Promise<{
    data: { session: Session; user: User };
    error: Error | null;
  }> {
    if (typeof creds.email === "string" && creds.email.includes("reject-me")) {
      const err = new Error("Storybook mocked sign-in error");
      return { data: {} as never, error: err };
    }
    const sess: Session = { ...loggedInSession, user: storyUser };
    this.setSession(sess);
    return { data: { session: sess, user: storyUser }, error: null };
  }

  async signUp(vars: {
    email: string;
    password?: string | undefined;
  }): Promise<{
    data: { user: User | null; session: Session | null };
    error: Error | null;
  }> {
    if (vars.email.includes("signup-reject-me")) {
      return {
        data: { user: null, session: null },
        error: new Error("Storybook mocked sign-up conflict"),
      };
    }
    const sess: Session = { ...loggedInSession, user: storyUser };
    this.setSession(sess);
    return { data: { user: storyUser, session: sess }, error: null };
  }

  async resetPasswordForEmail(email: string): Promise<{ error: Error | null }> {
    if (email.includes("reset-reject")) {
      return { error: new Error("Storybook reset failed") };
    }
    return { error: null };
  }

  async exchangeCodeForSession(): Promise<{
    data: { session: Session; user: User | undefined };
    error: null;
  }> {
    this.setSession(loggedInSession);
    return { data: { session: loggedInSession, user: storyUser }, error: null };
  }
}

/** Mutable auth for Storybook decorators. */
export const storybookAuth = new StorybookAuth();

let cachedClient: SupabaseClient | null = null;

export function createClient(): SupabaseClient {
  if (cachedClient) return cachedClient;

  cachedClient = { auth: storybookAuth } as unknown as SupabaseClient;

  return cachedClient;
}
