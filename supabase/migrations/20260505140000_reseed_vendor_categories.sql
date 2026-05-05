-- Re-seed public.vendor_categories when the table is empty.
-- Idempotent: runs only if there are no rows. Mirrors the seed in schema.sql
-- so a project that lost (or never received) the original seed self-heals
-- on next migration apply.
--
-- Fixes: production /admin/vendors/new rendering empty when categories table is empty.
do $$
begin
  if not exists (select 1 from public.vendor_categories) then
    insert into public.vendor_categories (name, slug, wizard_step_key, display_order) values
      ('אולם שמחות',  'venue',       'venue',         1),
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
  end if;
end
$$;
