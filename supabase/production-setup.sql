-- =================================================================
-- Wedding Hall - PRODUCTION ONE-SHOT SETUP
--
-- Open Supabase Studio → SQL editor → New query → paste this whole
-- file → click Run. That's it.
--
-- Idempotent: safe to re-run any number of times.
--
-- What you'll have when this finishes
-- -----------------------------------
--   * Tables   public.profiles, public.wedding_budgets
--                (with selections jsonb, guest_count_min/max columns)
--   * RLS      "own row only" select/insert/update/delete on both
--   * Trigger  on_auth_user_created → auto-creates a profile row for
--                every future signup (fixes "email already registered
--                but I can't see the user")
--   * Backfill profile rows for any existing orphaned auth.users
--   * Demo     test@gmail.com / test1234         (basic, no budget)
--   * Demo     demo@weddinghall.app / Demo!2026  (full mock budget)
--   * Repair   omri96david@gmail.com  (confirms email + ensures
--                profile + clears stuck tokens; password unchanged
--                unless you uncomment the marked block below)
-- =================================================================

-- ----------------------------------------------------------------
-- Extensions + helpers
-- ----------------------------------------------------------------
create extension if not exists "pgcrypto";

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
create policy "profiles_select_own" on public.profiles for select
  to authenticated using (auth.uid() = id);
drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles for insert
  to authenticated with check (auth.uid() = id);
drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles for update
  to authenticated using (auth.uid() = id) with check (auth.uid() = id);
drop policy if exists "profiles_delete_own" on public.profiles;
create policy "profiles_delete_own" on public.profiles for delete
  to authenticated using (auth.uid() = id);

-- ----------------------------------------------------------------
-- Auto-provision a public.profiles row whenever a new auth.users row
-- is created. SECURITY DEFINER so the GoTrue role can write to public
-- without RLS bypass. Eliminates the "I just signed up but my profile
-- is missing" race that produced the duplicate-email bug.
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

-- Backfill: any auth.users that pre-date the trigger get a profile now.
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
  add column if not exists guest_count_min integer
    check (guest_count_min is null or guest_count_min >= 0);
alter table public.wedding_budgets
  add column if not exists guest_count_max integer
    check (guest_count_max is null or guest_count_max >= 0);
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
create policy "wedding_budgets_select_own" on public.wedding_budgets for select
  to authenticated using (auth.uid() = user_id);
drop policy if exists "wedding_budgets_insert_own" on public.wedding_budgets;
create policy "wedding_budgets_insert_own" on public.wedding_budgets for insert
  to authenticated with check (auth.uid() = user_id);
drop policy if exists "wedding_budgets_update_own" on public.wedding_budgets;
create policy "wedding_budgets_update_own" on public.wedding_budgets for update
  to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "wedding_budgets_delete_own" on public.wedding_budgets;
create policy "wedding_budgets_delete_own" on public.wedding_budgets for delete
  to authenticated using (auth.uid() = user_id);

-- ================================================================
-- 1) Pre-confirmed test user: test@gmail.com / test1234
-- ================================================================
do $$
declare
  v_user_id uuid;
begin
  if exists (select 1 from auth.users where email = 'test@gmail.com') then
    raise notice 'test@gmail.com already exists, skipping';
  else
    v_user_id := gen_random_uuid();
    insert into auth.users (
      instance_id, id, aud, role,
      email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at,
      confirmation_token, email_change, email_change_token_new, recovery_token
    ) values (
      '00000000-0000-0000-0000-000000000000',
      v_user_id, 'authenticated', 'authenticated',
      'test@gmail.com',
      crypt('test1234', gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"full_name":"Test User"}'::jsonb,
      now(), now(), '', '', '', ''
    );
    insert into auth.identities (
      id, user_id, identity_data, provider, provider_id,
      last_sign_in_at, created_at, updated_at
    ) values (
      gen_random_uuid(), v_user_id,
      jsonb_build_object('sub', v_user_id::text, 'email', 'test@gmail.com',
                         'email_verified', true, 'phone_verified', false),
      'email', v_user_id::text, now(), now(), now()
    );
    insert into public.profiles (id, email, full_name)
    values (v_user_id, 'test@gmail.com', 'Test User')
    on conflict (id) do nothing;
    raise notice 'Created test@gmail.com (id %)', v_user_id;
  end if;
end $$;

-- ================================================================
-- 2) Repair omri96david@gmail.com (the production "stuck signup")
-- ================================================================
do $$
declare
  v_user_id uuid;
begin
  select id into v_user_id from auth.users where email = 'omri96david@gmail.com';

  if v_user_id is null then
    -- Create as pre-confirmed with a known temp password.
    v_user_id := gen_random_uuid();
    insert into auth.users (
      instance_id, id, aud, role,
      email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at,
      confirmation_token, email_change, email_change_token_new, recovery_token
    ) values (
      '00000000-0000-0000-0000-000000000000',
      v_user_id, 'authenticated', 'authenticated',
      'omri96david@gmail.com',
      crypt('Wedding!2026', gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"full_name":"Omri David"}'::jsonb,
      now(), now(), '', '', '', ''
    );
    insert into auth.identities (
      id, user_id, identity_data, provider, provider_id,
      last_sign_in_at, created_at, updated_at
    ) values (
      gen_random_uuid(), v_user_id,
      jsonb_build_object('sub', v_user_id::text, 'email', 'omri96david@gmail.com',
                         'email_verified', true, 'phone_verified', false),
      'email', v_user_id::text, now(), now(), now()
    );
    raise notice 'Created omri96david@gmail.com (id %, password Wedding!2026)', v_user_id;
  else
    -- Existing row — unstick it (confirm email, clear stuck tokens).
    update auth.users
       set email_confirmed_at      = coalesce(email_confirmed_at, now()),
           confirmation_token      = '',
           recovery_token          = '',
           email_change_token_new  = '',
           email_change            = '',
           updated_at              = now()
     where id = v_user_id;

    insert into auth.identities (
      id, user_id, identity_data, provider, provider_id,
      last_sign_in_at, created_at, updated_at
    )
    select gen_random_uuid(), v_user_id,
           jsonb_build_object('sub', v_user_id::text, 'email', 'omri96david@gmail.com',
                              'email_verified', true, 'phone_verified', false),
           'email', v_user_id::text, now(), now(), now()
    where not exists (
      select 1 from auth.identities
      where user_id = v_user_id and provider = 'email'
    );

    -- =====================================================
    -- OPTIONAL: uncomment to reset password to a known temp.
    -- =====================================================
    -- update auth.users
    --    set encrypted_password = crypt('Wedding!2026', gen_salt('bf'))
    --  where id = v_user_id;

    raise notice 'Repaired omri96david@gmail.com (id %)', v_user_id;
  end if;

  insert into public.profiles (id, email, full_name)
  values (v_user_id, 'omri96david@gmail.com', 'Omri David')
  on conflict (id) do update
    set email     = excluded.email,
        full_name = coalesce(public.profiles.full_name, excluded.full_name);
end $$;

-- ================================================================
-- 3) Demo test user with a full mock budget
--    demo@weddinghall.app / Demo!2026
-- ================================================================
do $$
declare
  v_user_id uuid;
  v_selections jsonb;
  -- Hand-computed total. Must match computeBudgetTotals() over the
  -- selections below (see packages/shared/src/budget-catalog.ts).
  --   venue avg 400 x 200    = 80000
  --   food_upgrade yes (3%)  =  2400
  --   bar premium            =  8000
  --   dj medium              =  8500
  --   photo medium           = 12000
  --   flowers ext_30 Lush    = 30000
  --   planner medium         = 18000
  --   addons (3)             = 10000
  --   bride rental           =  4000
  --   groom medium           =  3500
  --   villa skip             =     0
  --   transport small        =  3500
  --   car_rental premium     =  1500
  --   makeup medium          =  3000
  --   hidden_costs (3)       =  7000
  --   ----------------------------
  --   total                  = 191400
  v_total int := 191400;
begin
  select id into v_user_id from auth.users where email = 'demo@weddinghall.app';

  if v_user_id is null then
    v_user_id := gen_random_uuid();
    insert into auth.users (
      instance_id, id, aud, role,
      email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at,
      confirmation_token, email_change, email_change_token_new, recovery_token
    ) values (
      '00000000-0000-0000-0000-000000000000',
      v_user_id, 'authenticated', 'authenticated',
      'demo@weddinghall.app',
      crypt('Demo!2026', gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"full_name":"Maya Demo"}'::jsonb,
      now(), now(), '', '', '', ''
    );
    insert into auth.identities (
      id, user_id, identity_data, provider, provider_id,
      last_sign_in_at, created_at, updated_at
    ) values (
      gen_random_uuid(), v_user_id,
      jsonb_build_object('sub', v_user_id::text, 'email', 'demo@weddinghall.app',
                         'email_verified', true, 'phone_verified', false),
      'email', v_user_id::text, now(), now(), now()
    );
  else
    update auth.users
       set email_confirmed_at = coalesce(email_confirmed_at, now()),
           encrypted_password = crypt('Demo!2026', gen_salt('bf')),
           confirmation_token = '',
           recovery_token     = '',
           updated_at         = now()
     where id = v_user_id;
  end if;

  insert into public.profiles (id, email, full_name)
  values (v_user_id, 'demo@weddinghall.app', 'Maya Demo')
  on conflict (id) do update
    set email = excluded.email, full_name = excluded.full_name;

  v_selections := jsonb_build_object(
    'weddingTypeKind',   'hall',
    'continuedExtended', true,
    'selections', jsonb_build_object(
      'venue',        jsonb_build_object('kind', 'tier',         'optionId', 'average'),
      'food_upgrade', jsonb_build_object('kind', 'yes_no',       'optionId', 'yes'),
      'bar',          jsonb_build_object('kind', 'tier',         'optionId', 'premium'),
      'dj',           jsonb_build_object('kind', 'tier',         'optionId', 'average'),
      'photo',        jsonb_build_object('kind', 'tier',         'optionId', 'average'),
      'flowers',      jsonb_build_object('kind', 'multi_tier',
                                         'groupId', 'external',
                                         'optionId', 'ext_30'),
      'planner',      jsonb_build_object('kind', 'tier',         'optionId', 'average'),
      'addons',       jsonb_build_object('kind', 'multi_select',
                                         'itemIds', jsonb_build_array(
                                           'photo_booth', 'guest_gifts', 'candy_bar')),
      'bride',        jsonb_build_object('kind', 'tier',         'optionId', 'rental'),
      'groom',        jsonb_build_object('kind', 'tier',         'optionId', 'average'),
      'villa',        jsonb_build_object('kind', 'tier',         'optionId', 'skip'),
      'transport',    jsonb_build_object('kind', 'tier',         'optionId', 'small'),
      'car_rental',   jsonb_build_object('kind', 'tier',         'optionId', 'average'),
      'makeup',       jsonb_build_object('kind', 'tier',         'optionId', 'average'),
      'hidden_costs', jsonb_build_object('kind', 'multi_select',
                                         'itemIds', jsonb_build_array(
                                           'tips', 'stationery', 'misc'))
    ),
    'actuals', jsonb_build_object(
      'venue', 82000,
      'dj',     9000,
      'photo', 13500
    )
  );

  insert into public.wedding_budgets (
    user_id,
    couple_name_1, couple_name_2,
    preferred_day, guest_count, guest_count_min, guest_count_max,
    wedding_type, venue_price_type, venue_price_per_guest, venue_name,
    estimated_total, selections
  ) values (
    v_user_id,
    'Maya', 'Yoav',
    'thursday', 200, 180, 220,
    'hall', 'average', 400, 'Sunset Hall',
    v_total, v_selections
  )
  on conflict (user_id) do update set
    couple_name_1         = excluded.couple_name_1,
    couple_name_2         = excluded.couple_name_2,
    preferred_day         = excluded.preferred_day,
    guest_count           = excluded.guest_count,
    guest_count_min       = excluded.guest_count_min,
    guest_count_max       = excluded.guest_count_max,
    wedding_type          = excluded.wedding_type,
    venue_price_type      = excluded.venue_price_type,
    venue_price_per_guest = excluded.venue_price_per_guest,
    venue_name            = excluded.venue_name,
    estimated_total       = excluded.estimated_total,
    selections            = excluded.selections;

  raise notice '--- Demo user ready: demo@weddinghall.app / Demo!2026 ---';
  raise notice '   estimated_total: %', v_total;
end $$;

-- ================================================================
-- Verification (results appear in the editor result panel)
-- ================================================================
select
  email,
  email_confirmed_at is not null as email_confirmed,
  (select count(*) from auth.identities i
     where i.user_id = u.id and i.provider = 'email')          as email_identities,
  (select count(*) from public.profiles p where p.id = u.id)   as profiles_rows,
  (select count(*) from public.wedding_budgets w
     where w.user_id = u.id)                                   as budgets_rows
from auth.users u
where email in ('test@gmail.com', 'omri96david@gmail.com', 'demo@weddinghall.app')
order by email;

select
  (select count(*) from auth.users)                            as total_auth_users,
  (select count(*) from public.profiles)                       as total_profiles,
  (select count(*) from public.wedding_budgets)                as total_budgets,
  (select count(*) from auth.users u
     left join public.profiles p on p.id = u.id
     where p.id is null)                                       as orphaned_users;
