-- Wedding Hall - MVP demo seed
-- Creates a pre-confirmed test user that can sign in immediately with
-- email = test@gmail.com / password = test1234.
-- Idempotent: running it again is a no-op.
-- Safe to run on its own (does not require schema.sql to be run first).

create extension if not exists "pgcrypto";

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

  -- profile row may already exist if the public.profiles table was created
  -- via schema.sql; either way this is safe.
  begin
    insert into public.profiles (id, email, full_name)
    values (v_user_id, 'test@gmail.com', 'Test User')
    on conflict (id) do nothing;
  exception when undefined_table then
    raise notice 'public.profiles does not exist yet - run schema.sql to add it';
  end;

  raise notice '--- seeded test user ---';
  raise notice 'email:    test@gmail.com';
  raise notice 'password: test1234';
  raise notice 'id:       %', v_user_id;
end $$;

-- Verify: this row should be returned exactly once.
select id, email, email_confirmed_at
from auth.users
where email = 'test@gmail.com';
