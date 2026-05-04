-- =================================================================
--  Wedding Hall — data seed (demo user + staff admin)
--  Idempotent. For docker compose: `schema.sql` runs first, then this file.
--  For Supabase Cloud: you may run this after `schema.sql` or use this file
--  standalone (it still includes full DDL for one-shot paste).
--
--  Seeds: pre-confirmed demo user (test@gmail.com / test1234) and staff admin
--  (admin@weddinghall.app / Admin!2026, row in public.admin_users).
--  Reference categories (`vendor_categories`) live in `schema.sql`.
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
-- Auto-provision a profile row whenever a new auth.users row is created.
-- Eliminates the "I just signed up but my profile is missing" race.
-- ----------------------------------------------------------------
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

alter table public.wedding_budgets
  add column if not exists guest_count_min integer check (guest_count_min is null or guest_count_min >= 0);
alter table public.wedding_budgets
  add column if not exists guest_count_max integer check (guest_count_max is null or guest_count_max >= 0);
alter table public.wedding_budgets
  add column if not exists selections jsonb;

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
-- admin_users (staff gate; full DDL also in schema.sql)
-- ----------------------------------------------------------------
create table if not exists public.admin_users (
  user_id   uuid primary key references auth.users(id) on delete cascade,
  granted_by uuid references auth.users(id),
  granted_at timestamptz not null default now()
);

alter table public.admin_users enable row level security;

drop policy if exists "admin_users_select_own" on public.admin_users;
create policy "admin_users_select_own"
on public.admin_users for select
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
-- Staff admin (public.admin_users). Idempotent.
--   admin@weddinghall.app / Admin!2026
-- ----------------------------------------------------------------
do $$
declare
  v_user_id uuid;
begin
  select id into v_user_id from auth.users where email = 'admin@weddinghall.app';

  if v_user_id is null then
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
      'admin@weddinghall.app',
      crypt('Admin!2026', gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"full_name":"Staff Admin"}'::jsonb,
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
        'email', 'admin@weddinghall.app',
        'email_verified', true,
        'phone_verified', false
      ),
      'email',
      v_user_id::text,
      now(),
      now(),
      now()
    );

    raise notice 'Created staff admin admin@weddinghall.app (id %)', v_user_id;
  else
    update auth.users
       set email_confirmed_at = coalesce(email_confirmed_at, now()),
           encrypted_password = crypt('Admin!2026', gen_salt('bf')),
           confirmation_token = '',
           recovery_token     = '',
           updated_at         = now()
     where id = v_user_id;

    insert into auth.identities (
      id,
      user_id,
      identity_data,
      provider,
      provider_id,
      last_sign_in_at,
      created_at,
      updated_at
    )
    select gen_random_uuid(),
           v_user_id,
           jsonb_build_object(
             'sub', v_user_id::text,
             'email', 'admin@weddinghall.app',
             'email_verified', true,
             'phone_verified', false
           ),
           'email',
           v_user_id::text,
           now(),
           now(),
           now()
    where not exists (
      select 1 from auth.identities
      where user_id = v_user_id and provider = 'email'
    );

    raise notice 'Refreshed staff admin admin@weddinghall.app';
  end if;

  insert into public.profiles (id, email, full_name)
  values (v_user_id, 'admin@weddinghall.app', 'Staff Admin')
  on conflict (id) do update set
    email     = excluded.email,
    full_name = excluded.full_name;

  insert into public.admin_users (user_id)
  values (v_user_id)
  on conflict (user_id) do nothing;
end $$;

-- ----------------------------------------------------------------
-- Verification (these results should appear in the editor result panel)
-- ----------------------------------------------------------------
select
  (select count(*) from public.profiles)         as profiles_rows,
  (select count(*) from public.wedding_budgets)  as wedding_budgets_rows;

select
  u.email,
  p.full_name,
  exists (select 1 from public.admin_users a where a.user_id = u.id) as is_staff_admin
  from auth.users u
  join public.profiles p on p.id = u.id
 where u.email in (
   'test@gmail.com',
   'admin@weddinghall.app'
 )
 order by u.email;

-- Reload PostgREST schema cache (docker compose seed runs this after seed.sql).
notify pgrst, 'reload schema';
