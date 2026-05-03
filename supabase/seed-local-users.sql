-- =================================================================
-- Wedding Hall - local-only test users
--   Adds four pre-confirmed test users to the local docker stack,
--   each with a fully-populated mock budget so /dashboard and /budget
--   look realistic the moment they sign in.
--
--   alice@local.test / Alice!2026   (Maya & Yoav, Sunset Hall)
--   bob@local.test   / Bob!2026     (Dana & Idan, Olive Garden Hall)
--   carol@local.test / Carol!2026   (Noa  & Tom,  Vineyard Estate)
--   admin@local.test / Admin!2026   (Leah & Amir, Grand Pavilion; is_admin — /admin)
--
--   Selections + guest_count are intentionally identical so the
--   estimated_total math stays verified at 191400 (matches the demo
--   user in fix-prod-and-seed-demo-user.sql). Only display fields
--   (couple names, preferred_day, venue_name, actuals) differ.
--
-- For the full docker stack, `fix-prod-and-seed-demo-user.sql` also creates
-- admin@weddinghall.app (Admin!2026, is_admin). This file keeps admin@local.test
-- for developers who run it manually without that script.
-- Idempotent: safe to re-run.
--
-- How to run (from repo root):
--   docker compose cp supabase/seed-local-users.sql db:/seed-local-users.sql
--   docker compose exec db psql -U postgres -d postgres -v ON_ERROR_STOP=1 -f /seed-local-users.sql
--   docker compose exec db psql -U postgres -d postgres -c "NOTIFY pgrst, 'reload schema';"
-- =================================================================

do $$
declare
  v_user_id    uuid;
  v_selections jsonb;
  v_total      int := 191400;  -- verified against demo user

  -- (email, password, full_name, couple_1, couple_2, day, venue, actual_venue, actual_dj, actual_photo, is_admin text 'true'|'false')
  v_users constant text[][] := array[
    array['alice@local.test', 'Alice!2026', 'Alice Tester', 'Maya', 'Yoav', 'thursday', 'Sunset Hall',       '82000', '9000',  '13500', 'false'],
    array['bob@local.test',   'Bob!2026',   'Bob Tester',   'Dana', 'Idan', 'friday',   'Olive Garden Hall', '78000', '8200',  '11800', 'false'],
    array['carol@local.test', 'Carol!2026', 'Carol Tester', 'Noa',  'Tom',  'saturday', 'Vineyard Estate',   '85000', '9500',  '14200', 'false'],
    array['admin@local.test', 'Admin!2026', 'Admin Tester', 'Leah', 'Amir', 'wed',      'Grand Pavilion',    '88000', '8800',  '12800', 'true']
  ];
  v_row text[];
begin
  foreach v_row slice 1 in array v_users
  loop
    -- 1. Auth user (create or repair).
    select id into v_user_id from auth.users where email = v_row[1];

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
        v_row[1],
        crypt(v_row[2], gen_salt('bf')),
        now(),
        '{"provider":"email","providers":["email"]}'::jsonb,
        jsonb_build_object('full_name', v_row[3]),
        now(), now(),
        '', '', '', ''
      );
      raise notice 'Created %', v_row[1];
    else
      -- Existing user — confirm + reset password every run for determinism.
      update auth.users
         set email_confirmed_at = coalesce(email_confirmed_at, now()),
             encrypted_password = crypt(v_row[2], gen_salt('bf')),
             confirmation_token = '',
             recovery_token     = '',
             email_change       = '',
             email_change_token_new = '',
             updated_at         = now()
       where id = v_user_id;
      raise notice 'Refreshed %', v_row[1];
    end if;

    -- 2. Email identity (skip if already there).
    insert into auth.identities (
      id, user_id, identity_data, provider, provider_id,
      last_sign_in_at, created_at, updated_at
    )
    select gen_random_uuid(), v_user_id,
           jsonb_build_object(
             'sub', v_user_id::text,
             'email', v_row[1],
             'email_verified', true,
             'phone_verified', false
           ),
           'email', v_user_id::text,
           now(), now(), now()
    where not exists (
      select 1 from auth.identities
      where user_id = v_user_id and provider = 'email'
    );

    -- 3. Profile (the on_auth_user_created trigger should have done this,
    --    but backfill anyway in case the script runs against a stack where
    --    the trigger was skipped).
    insert into public.profiles (id, email, full_name, is_admin)
    values (v_user_id, v_row[1], v_row[3], v_row[11]::boolean)
    on conflict (id) do update
      set email     = excluded.email,
          full_name = excluded.full_name,
          is_admin  = excluded.is_admin;

    -- 4. Wedding budget — same selections as demo user (math verified).
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
        'venue', v_row[8]::int,
        'dj',    v_row[9]::int,
        'photo', v_row[10]::int
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
      v_row[4], v_row[5],
      v_row[6], 200, 100, 300,
      'hall', 'average', 400, v_row[7],
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
  end loop;

  raise notice '--- Local test users ready ---';
  raise notice '   alice@local.test / Alice!2026';
  raise notice '   bob@local.test   / Bob!2026';
  raise notice '   carol@local.test / Carol!2026';
  raise notice '   admin@local.test / Admin!2026 (admin)';
end $$;

-- -----------------------------------------------------------------
-- Verification — should return 4 rows, all with email_confirmed = true,
-- email_identities = 1, profiles_rows = 1, budgets_rows = 1.
-- -----------------------------------------------------------------
select email,
       email_confirmed_at is not null                                                            as email_confirmed,
       (select count(*) from auth.identities i where i.user_id = u.id and i.provider = 'email') as email_identities,
       (select count(*) from public.profiles p where p.id = u.id)                                as profiles_rows,
       (select count(*) from public.wedding_budgets w where w.user_id = u.id)                    as budgets_rows
from auth.users u
where email in ('alice@local.test', 'bob@local.test', 'carol@local.test', 'admin@local.test')
order by email;
