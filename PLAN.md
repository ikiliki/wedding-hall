# Wedding Hall - Build Plan

This plan governs what is in scope. New work must reference this file.

## Phase 1 (current scope)

- Landing page
- Email + password login (Supabase) - pre-filled MVP demo credentials
- Auth callback (OAuth / email confirmation redirect)
- User profile creation/loading (via server)
- Wedding onboarding flow:
  - Couple names
  - Preferred wedding day
  - Guest count
  - Wedding type (only **Hall** enabled)
  - Venue price selection
- Save budget to Supabase by `user_id` (via server)
- Dashboard with saved estimate (via server)
- `/admin` placeholder route, gated on `profiles.is_admin` (manually
  flipped via SQL — see `.claude-rules/skills/manual-vercel-supabase-runbook` step S6)

### Phase 1 routes (client — Vite dev server default port **5173**)

- `/`
- `/login`
- `/auth/callback`
- `/onboarding`
- `/dashboard`
- `/admin` — admin-only placeholder (real admin features deferred)

### Server (Phase 1)

The server is the **data gateway**. The browser still owns the Supabase Auth
session; every protected request forwards the user's JWT and the server
re-issues the call to Supabase with that JWT (RLS still applies). The server
uses the Supabase **anon** key only — never the service role.

System endpoints:
- `GET /api/health` — liveness for deploys and monitoring
- `GET /api/openapi.json` + `/docs` — OpenAPI 3.1 spec + Swagger UI

Data endpoints (require `Authorization: Bearer <access_token>`):
- `POST /api/profiles` — upsert current user's profile
- `GET /api/budget` — current user's latest budget (or null)
- `PUT /api/budget` — upsert budget; server validates and computes `estimated_total`

### Venue pricing (ILS per guest)

| Tier    | Price per guest |
| ------- | --------------- |
| Cheap   | 250             |
| Average | 400             |
| Premium | 650             |
| Custom  | user-entered    |

`estimated_total = guest_count * venue_price_per_guest`

Source of truth in-repo: `packages/shared/src/venue-pricing.ts` (re-exported
to the client as `client/src/shared/lib/venue-pricing.ts`; used server-side
by `server/src/lib/budget.ts`).

## Future phases (NOT in Phase 1, do not build yet)

- More budget questions (catering, photography, music, decor, etc.)
- Vendor directory
- Purchase through us (marketplace)
- Wedding website / save-the-date
- Actual vs estimated budget tracking
- Server endpoints that require the Supabase **service role** (admin /
  cross-user reads). The Phase 1 `/admin` route is a placeholder only —
  it gates on `profiles.is_admin` and never bypasses RLS. Real admin
  features (vendor CRUD, wizard-question editing, cross-user user
  lists) require the service-role exception, deliberately deferred.
