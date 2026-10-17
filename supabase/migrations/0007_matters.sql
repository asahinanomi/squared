-- squared.today — "what matters" moves to the account, so every device sees the same two lists.
-- Run once in Supabase: Dashboard → SQL Editor → paste → Run. Safe to run twice.
-- Adds one table; nothing existing is touched.

create table if not exists public.matters (
  user_id     uuid primary key default auth.uid() references auth.users (id) on delete cascade,
  meaningful  jsonb not null default '[]'::jsonb,
  empty       jsonb not null default '[]'::jsonb,
  -- when the lists were last changed, by the device that changed them (the newer copy wins)
  saved_at    timestamptz not null default now()
);

alter table public.matters enable row level security;

drop policy if exists "own matters: select" on public.matters;
drop policy if exists "own matters: insert" on public.matters;
drop policy if exists "own matters: update" on public.matters;
create policy "own matters: select" on public.matters for select to authenticated using (user_id = auth.uid());
create policy "own matters: insert" on public.matters for insert to authenticated with check (user_id = auth.uid());
create policy "own matters: update" on public.matters for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
