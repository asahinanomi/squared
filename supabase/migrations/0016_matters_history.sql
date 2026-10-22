-- squared.today — what matters is never lost again. Every time your lists change (or are deleted), the version
-- they replace is copied into matters_history first, so any earlier version can be brought back.
-- Run once in Supabase: Dashboard → SQL Editor → paste → Run. Safe to run twice.
-- To see your past versions: select archived_at, saved_at, meaningful, wasted from public.matters_history order by archived_at desc;

create table if not exists public.matters_history (
  id          bigint generated always as identity primary key,
  user_id     uuid not null references auth.users (id) on delete cascade,
  meaningful  jsonb not null,
  wasted      jsonb not null,
  saved_at    timestamptz,
  archived_at timestamptz not null default now()
);

alter table public.matters_history enable row level security;

drop policy if exists "read my matters history" on public.matters_history;
create policy "read my matters history" on public.matters_history
  for select to authenticated using (user_id = auth.uid());

create or replace function public.keep_matters_history() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'DELETE' or old.meaningful is distinct from new.meaningful or old.wasted is distinct from new.wasted then
    insert into public.matters_history (user_id, meaningful, wasted, saved_at)
    values (old.user_id, old.meaningful, old.wasted, old.saved_at);
  end if;
  return coalesce(new, old);
end $$;

drop trigger if exists matters_history on public.matters;
create trigger matters_history before update or delete on public.matters
  for each row execute function public.keep_matters_history();
