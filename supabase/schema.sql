-- Wedding Hall - schema (Phase 1+, Phase 2 admin vendors).
-- Idempotent: safe to re-run in the Supabase SQL editor.

-- ============================================================
-- Extensions
-- ============================================================
create extension if not exists "pgcrypto";

-- ============================================================
-- updated_at trigger function
-- ============================================================
create or replace function public.handle_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ============================================================
-- profiles
-- ============================================================
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists profiles_updated_at on public.profiles;
create trigger profiles_updated_at
before update on public.profiles
for each row execute function public.handle_updated_at();

alter table public.profiles enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
on public.profiles for select
to authenticated
using (auth.uid() = id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
on public.profiles for insert
to authenticated
with check (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
on public.profiles for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

drop policy if exists "profiles_delete_own" on public.profiles;
create policy "profiles_delete_own"
on public.profiles for delete
to authenticated
using (auth.uid() = id);

-- ============================================================
-- Auto-provision a public.profiles row whenever a new auth.users row
-- is created. Runs as SECURITY DEFINER so the GoTrue role can write
-- into public.profiles even without RLS bypass at row-policy level.
-- This means every successful sign-up has a matching profile row
-- *immediately* (no race vs. the post-auth `POST /api/profiles` call).
-- ============================================================
create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(
      new.raw_user_meta_data ->> 'full_name',
      new.raw_user_meta_data ->> 'name',
      null
    )
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_auth_user();

-- Backfill: any auth.users that pre-date the trigger (e.g. signups
-- attempted before this migration shipped) get a profile row now.
-- This is what unblocks the "email already registered but I can't see
-- the user" case from the production sign-up bug.
insert into public.profiles (id, email, full_name)
select
  u.id,
  u.email,
  coalesce(
    u.raw_user_meta_data ->> 'full_name',
    u.raw_user_meta_data ->> 'name',
    null
  )
from auth.users u
left join public.profiles p on p.id = u.id
where p.id is null;

-- ============================================================
-- wedding_budgets
-- ============================================================
create table if not exists public.wedding_budgets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  couple_name_1 text not null,
  couple_name_2 text not null,
  preferred_day text,
  guest_count integer not null check (guest_count >= 0),
  wedding_type text not null,
  venue_price_type text not null,
  venue_price_per_guest integer not null check (venue_price_per_guest >= 0),
  venue_name text,
  estimated_total integer not null check (estimated_total >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Phase 2 columns. Added with `add column if not exists` so re-running
-- this script against an existing project is safe.
alter table public.wedding_budgets
  add column if not exists guest_count_min integer check (guest_count_min is null or guest_count_min >= 0);
alter table public.wedding_budgets
  add column if not exists guest_count_max integer check (guest_count_max is null or guest_count_max >= 0);
alter table public.wedding_budgets
  add column if not exists selections jsonb;

-- Optional Gregorian date for homepage countdown (separate from preferred_day).
alter table public.wedding_budgets
  add column if not exists wedding_date date;

alter table public.wedding_budgets
  drop constraint if exists wedding_budgets_user_id_key;
alter table public.wedding_budgets
  add constraint wedding_budgets_user_id_key unique (user_id);

create index if not exists wedding_budgets_user_id_idx
  on public.wedding_budgets(user_id);

drop trigger if exists wedding_budgets_updated_at on public.wedding_budgets;
create trigger wedding_budgets_updated_at
before update on public.wedding_budgets
for each row execute function public.handle_updated_at();

alter table public.wedding_budgets enable row level security;

drop policy if exists "wedding_budgets_select_own" on public.wedding_budgets;
create policy "wedding_budgets_select_own"
on public.wedding_budgets for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "wedding_budgets_insert_own" on public.wedding_budgets;
create policy "wedding_budgets_insert_own"
on public.wedding_budgets for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "wedding_budgets_update_own" on public.wedding_budgets;
create policy "wedding_budgets_update_own"
on public.wedding_budgets for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "wedding_budgets_delete_own" on public.wedding_budgets;
create policy "wedding_budgets_delete_own"
on public.wedding_budgets for delete
to authenticated
using (auth.uid() = user_id);

-- ============================================================
-- admin_users  (Phase 2)
-- Canonical source of admin membership. The server checks this table
-- via the service role; regular clients only see their own row via RLS.
-- Management: INSERT/DELETE rows here manually (or via a future admin API).
-- ============================================================
create table if not exists public.admin_users (
  user_id   uuid primary key references auth.users(id) on delete cascade,
  granted_by uuid references auth.users(id),
  granted_at timestamptz not null default now()
);

alter table public.admin_users enable row level security;

-- A user can always read their own admin row (e.g. to know they're an admin).
drop policy if exists "admin_users_select_own" on public.admin_users;
create policy "admin_users_select_own"
on public.admin_users for select
to authenticated
using (auth.uid() = user_id);

-- Only the service role (server) may insert/update/delete.
-- No INSERT/UPDATE/DELETE policies = blocked for all authenticated roles.

-- ============================================================
-- vendor_categories  (Phase 2)
-- Taxonomy for vendors. wizard_step_key links to the budget wizard
-- step (WizardStepId in client) when a category maps to a specific
-- question. Null means the category has no wizard question yet.
-- ============================================================
create table if not exists public.vendor_categories (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  slug          text not null unique,
  wizard_step_key text,
  display_order integer not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

drop trigger if exists vendor_categories_updated_at on public.vendor_categories;
create trigger vendor_categories_updated_at
before update on public.vendor_categories
for each row execute function public.handle_updated_at();

alter table public.vendor_categories enable row level security;

-- Anyone (logged in or anon via the public API) may read categories.
drop policy if exists "vendor_categories_select_public" on public.vendor_categories;
create policy "vendor_categories_select_public"
on public.vendor_categories for select
using (true);

-- Write requires service role only (no authenticated insert/update/delete policy).

-- Seed default categories mapped to wizard steps.
insert into public.vendor_categories (name, slug, wizard_step_key, display_order) values
  ('אולם שמחות',  'venue',       'venue',        1),
  ('קייטרינג',    'catering',    'food_upgrade',  2),
  ('בר',          'bar',         'bar',           3),
  ('די-ג''יי',    'dj',          'dj',            4),
  ('צילום',       'photography', 'photo',         5),
  ('פרחים',       'flowers',     'flowers',       6),
  ('מתאמי חתונה', 'planner',     'planner',       7),
  ('תוספות',      'addons',      'addons',        8),
  ('שמלות כלה',   'bride',       'bride',         9),
  ('חליפות חתן',  'groom',       'groom',        10),
  ('וילות',       'villa',       'villa',        11),
  ('הסעות',       'transport',   'transport',    12),
  ('השכרת רכב',   'car_rental',  'car_rental',   13),
  ('איפור ושיער', 'makeup',      'makeup',       14),
  ('אחר',         'other',        null,           99)
on conflict (slug) do nothing;

-- ============================================================
-- vendors  (Phase 2)
-- One row per vendor. Soft-deleted via is_active = false.
-- photo_url points to a Supabase Storage object in the
-- `vendor-photos` bucket (public, read-only via Storage CDN).
-- ============================================================
create table if not exists public.vendors (
  id          uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.vendor_categories(id),
  name        text not null,
  phone       text,
  website_url text,
  photo_url   text,
  description text,
  city        text,
  price_range text,
  is_active   boolean not null default true,
  created_by  uuid references auth.users(id),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists vendors_category_id_idx on public.vendors(category_id);
create index if not exists vendors_is_active_idx   on public.vendors(is_active);

drop trigger if exists vendors_updated_at on public.vendors;
create trigger vendors_updated_at
before update on public.vendors
for each row execute function public.handle_updated_at();

alter table public.vendors enable row level security;

-- Public: any authenticated user can read active vendors.
drop policy if exists "vendors_select_active" on public.vendors;
create policy "vendors_select_active"
on public.vendors for select
to authenticated
using (is_active = true);

-- Write blocked for authenticated role; only service role (server) may
-- insert/update/delete (enforced in the Next.js route handlers).

-- ============================================================
-- Supabase Storage: vendor-photos bucket
-- Create manually in the Supabase dashboard (or via CLI):
--   supabase storage create vendor-photos --public
-- Then add this Storage policy via the dashboard > Storage > Policies:
--   Bucket: vendor-photos
--   Policy name: admin_upload
--   Operation: INSERT (and UPDATE, DELETE)
--   Expression:
--     exists (
--       select 1 from public.admin_users
--       where user_id = auth.uid()
--     )
-- Public read is handled by making the bucket public (no RLS for GET).
-- ============================================================
