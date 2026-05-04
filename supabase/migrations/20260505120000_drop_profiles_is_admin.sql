-- Retire legacy profiles.is_admin: copy to admin_users, then drop column.
-- Idempotent: skips when the column no longer exists (new installs / post-schema.sql).

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'profiles'
      and column_name = 'is_admin'
  ) then
    insert into public.admin_users (user_id)
    select id from public.profiles where is_admin = true
    on conflict (user_id) do nothing;

    alter table public.profiles drop column is_admin;
  end if;
end $$;
