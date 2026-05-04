---
name: wedding-hall-budget-flow
description: How the multi-step budget wizard is structured — catalog-driven steps, shared selections type, server-authoritative totals. Use when adding a new budget category, changing tier prices, or debugging why a value is or isn't appearing on the dashboard / final budget.
---

# Wedding Hall — budget wizard flow

The wizard at `/start` walks the couple through ~17 questions: couple
names, day, guest range, wedding type, then 8 hall-flow categories,
then an optional 7-category extended path, then a completion screen.
Almost every question shares one of four templates, so adding a new
category is **catalog config**, not new screens.

## Source of truth

Everything that drives prices or step ordering lives in
`packages/shared/`:

| File | Role |
|------|------|
| `packages/shared/src/budget-catalog.ts` | All categories: id, title, info text, template (`tier` / `yes_no` / `multi_select` / `multi_tier`), and price tiers/items. |
| `packages/shared/src/budget-selections.ts` | Selection type union (what the wizard saves) + `computeBudgetTotals` (the pure pricing function used by client preview AND server recompute). |
| `packages/shared/src/types.ts` | `WeddingBudget` (DB row), `SaveBudgetPayload` (wire format). |

Both client and server import from `@wedding-hall/shared`. **Never**
duplicate prices or category labels in the client — change the catalog
in one place.

## Client wiring

| File | Role |
|------|------|
| `client/src/features/budget-wizard/state/wizard-types.ts` | Context type + `createContext` (no JSX so React Refresh stays happy). |
| `client/src/features/budget-wizard/state/wizard-context.tsx` | `WizardProvider` — owns state, `localStorage` autosave, `saveServer()`. |
| `client/src/features/budget-wizard/state/use-wizard.ts` | `useWizard()` hook. |
| `client/src/features/budget-wizard/state/steps.ts` | Step ordering, `nextStep`, `previousStep`, `urlFor`. |
| `client/src/features/budget-wizard/components/CategoryStep/` | Generic renderer that turns any `CategoryDef` into a screen. |
| `client/src/features/budget-wizard/components/Step{Couple,Date,Guests,Type,ContinueGate,Completion}/` | Bespoke screens (the 4 core questions, the "Continue?" gate, and the completion view). |
| `client/src/features/budget-wizard/pages/WizardPage.tsx` | `RequireAuth` + `<WizardProvider>` + nested `<Routes>` for `/start/:step`. |

## Server wiring

| File | Role |
|------|------|
| `server/src/lib/budget.ts` | `validateBudgetPayload()` — sanitises selections, recomputes `estimated_total` from the catalog. **Never trust the client total.** |
| `server/src/app/api/budget/route.ts` | GET / PUT `/api/budget`, scoped by JWT. |

## Adding a new category

1. Append a `CategoryDef` to `HALL_CATEGORIES` or `EXTENDED_CATEGORIES`
   in `budget-catalog.ts`. Pick a `template`.
2. Add the new step id to `WIZARD_PATH` in `client/src/features/budget-wizard/state/steps.ts`.
3. Add it to `CATEGORY_STEPS` in `WizardPage.tsx`.
4. Done — `CategoryStep` renders it and the running total updates
   automatically. The dashboard + final budget pages also pick it up
   for free because they iterate `ALL_CATEGORIES`.

## Changing prices

Edit numbers only in `budget-catalog.ts`. The shared `computeBudgetTotals`
is what the server uses on every PUT, so old saved budgets re-compute to
new totals on the next save (the stored `estimated_total` is recomputed
from `selections` on each PUT — no migration needed).

## Where the running total comes from

- **Client (preview):** `useWizard().total` — `computeBudgetTotals(selections, guestMid)` runs on every state change. Shown in the right-side summary panel of `WizardLayout`.
- **Server (authoritative):** `validateBudgetPayload` runs the same function and stores the result in `wedding_budgets.estimated_total`.

If they disagree, it's almost always because the client is sanitising
something the server is dropping (e.g. unknown `optionId`).

## Don't

- Don't write to `wedding_budgets` from the client. Use `saveBudget()` from `client/src/features/budget-wizard/lib/saveBudget.ts` (which calls `PUT /api/budget`).
- Don't compute totals in components — call `computeBudgetTotals()` from the shared package.
- Don't add tier numbers to the client. Catalog only.
