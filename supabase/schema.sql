-- Wedding Hall - schema (Phase 1+).
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
