---
name: admin-vendor-management
description: How the admin vendor catalog works — tables, service-role endpoints, photo upload, and category-wizard linking. Read before adding vendors, new categories, or admin features.
type: reference
---

# Skill: Admin Vendor Management

## Overview

The admin vendor system lets Wedding Hall staff maintain a vendor catalog grouped by categories. Categories are linked to budget wizard questions so the right vendors can be surfaced to users later.

## Database tables

| Table | Purpose |
|---|---|
| `admin_users` | Canonical admin membership. Add/remove rows here only. |
| `vendor_categories` | Taxonomy. Each category has an optional `wizard_step_key` matching a `WizardStepId`. |
| `vendors` | One row per vendor. Soft-deleted via `is_active = false`. |

### Adding an admin user

```sql
insert into public.admin_users (user_id)
values ('<supabase-auth-user-uuid>');
```

Find the UUID in the Supabase dashboard → Authentication → Users.

### Removing an admin user

```sql
delete from public.admin_users where user_id = '<uuid>';
```

## Service-role key setup (required for admin endpoints)

Admin API routes use `SUPABASE_SERVICE_ROLE_KEY` to bypass RLS for cross-user operations.

1. Supabase dashboard → Project Settings → API → **service_role** secret.
2. Add to `server/.env.local`:
   ```
   SUPABASE_SERVICE_ROLE_KEY=<key>
   ```
3. Add to Vercel server project env vars (same key, name `SUPABASE_SERVICE_ROLE_KEY`).
4. Redeploy the server project on Vercel.

**Never expose this key to the browser or commit it to git.**

## Supabase Storage: vendor-photos bucket (manual setup)

The vendor photo upload uses a Supabase Storage bucket called `vendor-photos`.

### Create the bucket (one-time)

1. Supabase dashboard → Storage → New bucket.
2. Name: `vendor-photos`. Enable **Public bucket** (CDN reads are unauthenticated).
3. Save.

### Add upload policy (admin-only writes)

1. Storage → `vendor-photos` → Policies → New policy → Custom.
2. Name: `admin_upload`. Operations: **INSERT**, **UPDATE**, **DELETE**.
3. Expression:
   ```sql
   exists (
     select 1 from public.admin_users
     where user_id = auth.uid()
   )
   ```
4. Save.

## Linking categories to wizard steps

The `vendor_categories.wizard_step_key` column holds a `WizardStepId` string (e.g. `"photo"`, `"dj"`). When a user reaches that wizard step, the system can look up vendors with the matching category.

Seed rows with `wizard_step_key` are already inserted by `supabase/schema.sql`. To add a new category and link it:

```sql
insert into public.vendor_categories (name, slug, wizard_step_key, display_order)
values ('שם הקטגוריה', 'slug-in-english', 'wizard_step_id_or_null', 50);
```

To update a link:

```sql
update public.vendor_categories
set wizard_step_key = 'new_step_id'
where slug = 'category-slug';
```

## API endpoints (all require admin JWT)

| Method | Path | Description |
|---|---|---|
| GET | `/api/admin/categories` | List all categories ordered by `display_order` |
| POST | `/api/admin/categories` | Create a category (`name`, `slug` required) |
| GET | `/api/admin/vendors` | List vendors (`?category=<slug>`, `?include_inactive=true`) |
| POST | `/api/admin/vendors` | Create vendor (`name`, `category_id` required) |
| GET | `/api/admin/vendors/:id` | Get one vendor |
| PUT | `/api/admin/vendors/:id` | Update vendor (any fields) |
| DELETE | `/api/admin/vendors/:id` | Soft-delete (sets `is_active = false`) |

## Client routes

| Route | Page |
|---|---|
| `/admin` | AdminHomePage — tile menu |
| `/admin/vendors` | VendorListPage — filter by category, edit/deactivate |
| `/admin/vendors/new` | VendorFormPage (create mode) |
| `/admin/vendors/:id/edit` | VendorFormPage (edit mode) |

## Photo upload flow

1. Admin clicks "העלה תמונה" in VendorForm.
2. File input triggers `handleFileChange`.
3. Client calls `supabase.storage.from("vendor-photos").upload(path, file)`.
4. On success, `getPublicUrl(path)` returns the CDN URL.
5. URL is stored in the `photo_url` field of the form (and then sent to the server on save).

If storage is not set up, the URL field can be filled manually with any hosted image URL.

## Common tasks

### Restore a soft-deleted vendor
```sql
update public.vendors set is_active = true where id = '<uuid>';
```

### Add a new category visible on the wizard step page
1. Insert into `vendor_categories` with the matching `wizard_step_key`.
2. The admin vendor list and form will immediately show the new category.

### Debug "Forbidden" on admin endpoints
- Confirm the user's UUID is in `public.admin_users`.
- Confirm `SUPABASE_SERVICE_ROLE_KEY` is set on the server.
- Check server logs for `requireAdmin: db error` messages.
