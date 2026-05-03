-- Optional calendar date for countdown on the dashboard (distinct from preferred_day weekday bucket).
alter table public.wedding_budgets
  add column if not exists wedding_date date;
