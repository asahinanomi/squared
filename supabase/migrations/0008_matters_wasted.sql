-- squared.today — "what matters": the second list is called wasted (the red paint), so its column is too.
-- Run once in Supabase: Dashboard → SQL Editor → paste → Run. Safe to run twice. Keeps every entry.

do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'matters' and column_name = 'empty'
  ) then
    alter table public.matters rename column empty to wasted;
  end if;
end $$;
