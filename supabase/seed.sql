-- =================================================================
--  Wedding Hall - one-shot Supabase setup
--  Paste this entire file into the Supabase SQL Editor and click Run.
--  Idempotent: safe to run multiple times.
--  Creates: profiles + wedding_budgets tables, RLS policies, and a
--  pre-confirmed demo user (test@gmail.com / test1234).
-- =================================================================

-- ----------------------------------------------------------------
-- Extensions
-- ----------------------------------------------------------------
create extension if not exists "pgcrypto";

-- ----------------------------------------------------------------
-- updated_at trigger function
-- ----------------------------------------------------------------
create or replace function public.handle_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ----------------------------------------------------------------
-- profiles
-- ----------------------------------------------------------------
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

-- ----------------------------------------------------------------
-- wedding_budgets
-- ----------------------------------------------------------------
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

-- One budget per user. Allows onboarding to be re-run as an "edit"
-- via upsert(on_conflict=user_id), and prevents duplicate-row drift.
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

-- ----------------------------------------------------------------
-- Demo test user (pre-confirmed). Idempotent.
-- ----------------------------------------------------------------
do $$
declare
  v_user_id uuid;
begin
  if exists (select 1 from auth.users where email = 'test@gmail.com') then
    raise notice 'test@gmail.com already exists, skipping seed';
    return;
  end if;

  v_user_id := gen_random_uuid();

  insert into auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
  ) values (
    '00000000-0000-0000-0000-000000000000',
    v_user_id,
    'authenticated',
    'authenticated',
    'test@gmail.com',
    crypt('test1234', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"full_name":"Test User"}'::jsonb,
    now(),
    now(),
    '',
    '',
    '',
    ''
  );

  insert into auth.identities (
    id,
    user_id,
    identity_data,
    provider,
    provider_id,
    last_sign_in_at,
    created_at,
    updated_at
  ) values (
    gen_random_uuid(),
    v_user_id,
    jsonb_build_object(
      'sub', v_user_id::text,
      'email', 'test@gmail.com',
      'email_verified', true,
      'phone_verified', false
    ),
    'email',
    v_user_id::text,
    now(),
    now(),
    now()
  );

  insert into public.profiles (id, email, full_name)
  values (v_user_id, 'test@gmail.com', 'Test User')
  on conflict (id) do nothing;

  raise notice '--- Wedding Hall setup complete ---';
  raise notice 'Tables created: public.profiles, public.wedding_budgets';
  raise notice 'Demo user:      test@gmail.com / test1234 (id %)', v_user_id;
end $$;

-- ----------------------------------------------------------------
-- Verification (these results should appear in the editor result panel)
-- ----------------------------------------------------------------
select
  (select count(*) from public.profiles)         as profiles_rows,
  (select count(*) from public.wedding_budgets)  as wedding_budgets_rows,
  (select id from auth.users where email = 'test@gmail.com') as test_user_id;
