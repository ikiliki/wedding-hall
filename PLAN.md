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
  flipped via SQL — see `.claude/skills/manual-vercel-supabase-runbook` step S6)

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

## Phase 2 (current — admin vendors)

- **`admin_users` table** — canonical source of admin membership. Replaces
  `profiles.is_admin` flag. Server reads this via the service role.
- **`vendor_categories` table** — taxonomy linked to wizard steps via
  `wizard_step_key` (matches `WizardStepId`).
- **`vendors` table** — one row per vendor. Soft-deleted via `is_active`.
  Photo stored in Supabase Storage bucket `vendor-photos`.

### Phase 2 routes (admin sub-routes)

- `/admin` — updated home page; Vendor tile is a live link.
- `/admin/vendors` — vendor list filtered by category, includes inactive toggle.
- `/admin/vendors/new` — create vendor form (photo upload, all fields).
- `/admin/vendors/:id/edit` — edit existing vendor.

### Phase 2 server endpoints (require `SUPABASE_SERVICE_ROLE_KEY`)

All admin endpoints gate on `admin_users` via the service role before
performing any data operation.

- `GET /api/admin/categories` — list all vendor categories.
- `POST /api/admin/categories` — create a category.
- `GET /api/admin/vendors` — list vendors (filterable by category, inactive).
- `POST /api/admin/vendors` — create vendor.
- `GET /api/admin/vendors/[id]` — get one vendor.
- `PUT /api/admin/vendors/[id]` — update vendor fields.
- `DELETE /api/admin/vendors/[id]` — soft-delete (set `is_active = false`).

### Phase 2 Supabase Storage

Bucket: `vendor-photos` (public, read-only CDN). Upload allowed only for
rows in `admin_users`. See skill for manual setup steps.

## Future phases (NOT in scope yet)

- Vendor directory visible to regular users.
- Purchase through us (marketplace).
- Wedding website / save-the-date.
- Actual vs estimated budget tracking.
- Wizard-question editing UI for admins.
- Cross-user user lists / reports (requires service role, deliberately deferred).
