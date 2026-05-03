-- =================================================================
-- Wedding Hall - production repair + demo test user
-- Paste this entire file into the Supabase SQL Editor and click Run.
-- Idempotent: safe to re-run.
--
-- What it does
-- ------------
--   1. Repairs the stuck omri96david@gmail.com signup ("email already
--      registered, but I don't see it in DB"): confirms the email,
--      clears any stuck confirmation/recovery tokens, and ensures a
--      matching public.profiles row exists.
--      *Password is NOT changed* — sign in with whatever you originally
--      used, or click "Email me a reset link" on the login form.
--      (If you can't remember the password, uncomment the marked block
--      below to set it to a temporary value.)
--
--   2. Creates / refreshes a demo test user with a fully-populated
--      mock budget so /dashboard and /budget have realistic data the
--      moment you sign in:
--           email     demo@weddinghall.app
--           password  Demo!2026
--
-- Prereq: schema.sql has already been run at least once against this
-- project (otherwise the on_auth_user_created trigger and the
-- selections / guest_count_min / guest_count_max columns will be
-- missing). Re-running schema.sql is safe — it's idempotent.
--
--   3. Staff admin (`profiles.is_admin`) + same mock budget shape as the
--      demo user so `/admin` works after docker compose seed:
--           email     admin@weddinghall.app
--           password  Admin!2026
-- =================================================================

alter table public.profiles
  add column if not exists is_admin boolean not null default false;

-- -----------------------------------------------------------------
-- 1. Repair omri96david@gmail.com
-- -----------------------------------------------------------------
do $$
declare
  v_user_id uuid;
begin
  select id into v_user_id
  from auth.users
  where email = 'omri96david@gmail.com';

  if v_user_id is null then
    -- Truly doesn't exist — create the user pre-confirmed.
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
      now(), now(),
      '', '', '', ''
    );
    insert into auth.identities (
      id, user_id, identity_data, provider, provider_id,
      last_sign_in_at, created_at, updated_at
    ) values (
      gen_random_uuid(), v_user_id,
      jsonb_build_object(
        'sub', v_user_id::text,
        'email', 'omri96david@gmail.com',
        'email_verified', true,
        'phone_verified', false
      ),
      'email', v_user_id::text,
      now(), now(), now()
    );
    raise notice 'Created omri96david@gmail.com (id %, password Wedding!2026)', v_user_id;
  else
    -- Existing row — just unstick it.
    update auth.users
       set email_confirmed_at      = coalesce(email_confirmed_at, now()),
           confirmation_token      = '',
           recovery_token          = '',
           email_change_token_new  = '',
           email_change            = '',
           updated_at              = now()
     where id = v_user_id;

    -- Ensure email identity exists (some half-broken signups skip it).
    insert into auth.identities (
      id, user_id, identity_data, provider, provider_id,
      last_sign_in_at, created_at, updated_at
    )
    select gen_random_uuid(), v_user_id,
           jsonb_build_object(
             'sub', v_user_id::text,
             'email', 'omri96david@gmail.com',
             'email_verified', true,
             'phone_verified', false
           ),
           'email', v_user_id::text,
           now(), now(), now()
    where not exists (
      select 1 from auth.identities
      where user_id = v_user_id and provider = 'email'
    );

    -- =====================================================
    -- OPTIONAL: uncomment to reset the password to a known
    -- temporary value if you can't remember the original.
    -- =====================================================
    -- update auth.users
    --    set encrypted_password = crypt('Wedding!2026', gen_salt('bf'))
    --  where id = v_user_id;

    raise notice 'Repaired omri96david@gmail.com (id %)', v_user_id;
  end if;

  -- Backfill the profile row even if the trigger missed it.
  insert into public.profiles (id, email, full_name)
  values (v_user_id, 'omri96david@gmail.com', 'Omri David')
  on conflict (id) do update
    set email     = excluded.email,
        full_name = coalesce(public.profiles.full_name, excluded.full_name);
end $$;

-- -----------------------------------------------------------------
-- 2. Demo test user with a fully-populated mock budget
-- -----------------------------------------------------------------
do $$
declare
  v_user_id uuid;
  v_selections jsonb;
  -- Hand-computed total. Must match computeBudgetTotals() over the
  -- selections below (see packages/shared/src/budget-catalog.ts).
  --   venue (avg 400 x 200)              = 80000
  --   food_upgrade yes (3% of venue)     =  2400
  --   bar premium                        =  8000
  --   dj medium                          =  8500
  --   photo medium                       = 12000
  --   flowers ext_30 (Lush)              = 30000
  --   planner medium                     = 18000
  --   addons (booth+gifts+candy)         = 10000
  --   bride rental                       =  4000
  --   groom medium                       =  3500
  --   villa skip                         =     0
  --   transport small                    =  3500
  --   car_rental premium                 =  1500
  --   makeup medium                      =  3000
  --   hidden_costs (tips+sta+misc)       =  7000
  --   ----------------------------------------
  --   total                              = 191400
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
      now(), now(),
      '', '', '', ''
    );
    insert into auth.identities (
      id, user_id, identity_data, provider, provider_id,
      last_sign_in_at, created_at, updated_at
    ) values (
      gen_random_uuid(), v_user_id,
      jsonb_build_object(
        'sub', v_user_id::text,
        'email', 'demo@weddinghall.app',
        'email_verified', true,
        'phone_verified', false
      ),
      'email', v_user_id::text,
      now(), now(), now()
    );
  else
    -- Make the demo deterministic: confirm + reset password every run.
    update auth.users
       set email_confirmed_at = coalesce(email_confirmed_at, now()),
           encrypted_password = crypt('Demo!2026', gen_salt('bf')),
           confirmation_token = '',
           recovery_token     = '',
           updated_at         = now()
     where id = v_user_id;
  end if;

  insert into public.profiles (id, email, full_name, is_admin)
  values (v_user_id, 'demo@weddinghall.app', 'Maya Demo', false)
  on conflict (id) do update
    set email     = excluded.email,
        full_name = excluded.full_name,
        is_admin  = false;

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
    -- A few "real" prices already filled in so the right column on
    -- /budget isn't empty. The rest stay blank for you to play with.
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

  raise notice '--- Demo test user ready ---';
  raise notice '   email:    demo@weddinghall.app';
  raise notice '   password: Demo!2026';
  raise notice '   estimated_total: %', v_total;
end $$;

-- -----------------------------------------------------------------
-- 3. Staff admin (`profiles.is_admin`) + mock budget (matches §2 math)
--     admin@weddinghall.app / Admin!2026
-- -----------------------------------------------------------------
do $$
declare
  v_user_id uuid;
  v_selections jsonb;
  v_total int := 191400;
begin
  select id into v_user_id from auth.users where email = 'admin@weddinghall.app';

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
      'admin@weddinghall.app',
      crypt('Admin!2026', gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"full_name":"Staff Admin"}'::jsonb,
      now(), now(),
      '', '', '', ''
    );
    insert into auth.identities (
      id, user_id, identity_data, provider, provider_id,
      last_sign_in_at, created_at, updated_at
    ) values (
      gen_random_uuid(), v_user_id,
      jsonb_build_object(
        'sub', v_user_id::text,
        'email', 'admin@weddinghall.app',
        'email_verified', true,
        'phone_verified', false
      ),
      'email', v_user_id::text,
      now(), now(), now()
    );
  else
    update auth.users
       set email_confirmed_at = coalesce(email_confirmed_at, now()),
           encrypted_password = crypt('Admin!2026', gen_salt('bf')),
           confirmation_token = '',
           recovery_token     = '',
           updated_at         = now()
     where id = v_user_id;

    insert into auth.identities (
      id, user_id, identity_data, provider, provider_id,
      last_sign_in_at, created_at, updated_at
    )
    select gen_random_uuid(), v_user_id,
           jsonb_build_object(
             'sub', v_user_id::text,
             'email', 'admin@weddinghall.app',
             'email_verified', true,
             'phone_verified', false
           ),
           'email', v_user_id::text,
           now(), now(), now()
    where not exists (
      select 1 from auth.identities
      where user_id = v_user_id and provider = 'email'
    );
  end if;

  insert into public.profiles (id, email, full_name, is_admin)
  values (v_user_id, 'admin@weddinghall.app', 'Staff Admin', true)
  on conflict (id) do update
    set email     = excluded.email,
        full_name = excluded.full_name,
        is_admin  = true;

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
      'venue', 88000,
      'dj',     8800,
      'photo', 12800
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
    'Leah', 'Amir',
    'wed', 200, 180, 220,
    'hall', 'average', 400, 'Grand Pavilion',
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

  raise notice '--- Staff admin ready ---';
  raise notice '   email:    admin@weddinghall.app';
  raise notice '   password: Admin!2026';
  raise notice '   profiles.is_admin: true';
end $$;

-- -----------------------------------------------------------------
-- Verification
-- -----------------------------------------------------------------
select email,
       email_confirmed_at is not null as email_confirmed,
       (select count(*) from auth.identities i where i.user_id = u.id and i.provider = 'email') as email_identities,
       (select count(*) from public.profiles p where p.id = u.id) as profiles_rows,
       coalesce((select p.is_admin from public.profiles p where p.id = u.id), false) as is_admin,
       (select count(*) from public.wedding_budgets w where w.user_id = u.id) as budgets_rows
from auth.users u
where email in ('omri96david@gmail.com', 'demo@weddinghall.app', 'admin@weddinghall.app')
order by email;
