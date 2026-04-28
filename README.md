# Wedding Hall

Minimal, black-and-white wedding-budget MVP. A user signs in with email + password (pre-filled demo creds for now), walks through a short onboarding wizard, and lands on a dashboard with their venue budget estimate.

Stack: **Next.js 15 (App Router)** + **TypeScript** + **Tailwind CSS** + **Supabase Auth + Postgres** + **Vercel**.

> Scope is governed by [`PLAN.md`](./PLAN.md). Working rules are in [`RULES.md`](./RULES.md).

---

## 1. Local setup

```bash
git clone https://github.com/ikiliki/wedding-hall.git
cd wedding-hall
npm install
cp .env.example .env.local
# fill in NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY (see step 2)
npm run dev
```

App runs on <http://localhost:3000>.

---

## 2. Supabase setup

1. Create a new project at <https://supabase.com>.
2. Go to **Project Settings -> API** and copy:
   - `Project URL` -> `NEXT_PUBLIC_SUPABASE_URL`
   - `anon` `public` API key -> `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. **Authentication -> Providers -> Email**: leave enabled (default). For the MVP demo flow with `test@gmail.com` / `test1234`, **turn OFF "Confirm email"** under that provider's settings — otherwise Supabase will block the auto-signup until the user clicks a confirmation link in an inbox we don't control.
4. Go to **Authentication -> URL Configuration** and add to **Redirect URLs**:
   ```
   http://localhost:3000/auth/callback
   https://<your-vercel-domain>/auth/callback
   ```
   Set **Site URL** to your production domain (or `http://localhost:3000` while developing).

### Run the schema

Open **SQL Editor** in Supabase and run the entire contents of [`supabase/schema.sql`](./supabase/schema.sql). This creates the `profiles` and `wedding_budgets` tables and the row-level security policies. It is idempotent and safe to re-run.

---

## 3. Environment variables

`.env.local` (local) and Vercel project env (production + preview + development) both need:

| Key                              | Value                                  |
| -------------------------------- | -------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`       | Your Supabase project URL              |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY`  | Your Supabase `anon` `public` API key  |

There are no server-side secrets in Phase 1. The anon key is safe to expose to the browser; row-level security in Postgres is what protects user data.

---

## 4. Deploy to Vercel

### Option A: GitHub import (recommended)

1. Push this repo to GitHub (it already lives at `https://github.com/ikiliki/wedding-hall.git`).
2. Go to <https://vercel.com/new>, import the repo.
3. Framework preset will auto-detect as **Next.js**. Leave defaults.
4. Add the two environment variables under **Environment Variables** (Production, Preview, Development).
5. Click **Deploy**.
6. After the first deploy, copy the production URL and add `https://<that-domain>/auth/callback` to Supabase **Authentication -> URL Configuration -> Redirect URLs**.

### Option B: Vercel CLI

```bash
npm i -g vercel
vercel login
vercel link
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
vercel --prod
```

---

## 5. Scripts

```bash
npm run dev     # local dev server
npm run lint    # eslint
npm run build   # production build (must pass before any deploy)
npm start       # run the production build locally
```

---

## 6. Project layout

```
src/
  app/                    # routes (App Router)
    page.tsx              # /
    login/page.tsx        # /login
    auth/callback/route.ts# /auth/callback
    onboarding/page.tsx   # /onboarding
    dashboard/page.tsx    # /dashboard
    logout/route.ts       # POST /logout
  components/             # common UI (Button, Card, GoogleSignInButton, LogoutButton)
  features/
    onboarding/           # multi-step wizard + saveBudget server action
    dashboard/            # BudgetSummary
  lib/
    supabase/             # browser + server + middleware clients (@supabase/ssr)
    types.ts              # Profile, WeddingBudget
    venue-pricing.ts      # tier prices in ILS
  middleware.ts           # session refresh + /onboarding & /dashboard protection
supabase/
  schema.sql              # tables + RLS
```

---

## 7. Phase scope reminder

Phase 1 only. No vendors, marketplace, payments, admin, or save-the-date in this codebase yet. See [`PLAN.md`](./PLAN.md) and [`RULES.md`](./RULES.md).
