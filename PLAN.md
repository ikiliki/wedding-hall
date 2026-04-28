# Wedding Hall - Build Plan

This plan governs what is in scope. New work must reference this file.

## Phase 1 (current scope)

- Landing page
- Email + password login (Supabase) - pre-filled MVP demo credentials
- Auth callback
- User profile creation/loading
- Wedding onboarding flow:
  - Couple names
  - Preferred wedding day
  - Guest count
  - Wedding type (only **Hall** enabled)
  - Venue price selection
- Save budget to Supabase by `user_id`
- Dashboard with saved estimate

### Phase 1 routes

- `/`
- `/login`
- `/auth/callback`
- `/onboarding`
- `/dashboard`

### Venue pricing (ILS per guest)

| Tier    | Price per guest |
| ------- | --------------- |
| Cheap   | 250             |
| Average | 400             |
| Premium | 650             |
| Custom  | user-entered    |

`estimated_total = guest_count * venue_price_per_guest`

## Future phases (NOT in Phase 1, do not build yet)

- More budget questions (catering, photography, music, decor, etc.)
- Vendor directory
- Purchase through us (marketplace)
- Wedding website / save-the-date
- Actual vs estimated budget tracking
