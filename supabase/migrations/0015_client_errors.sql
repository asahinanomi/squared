-- squared.today — why a save failed. When a save from the app fails, the app writes one short line here: what it
-- was saving, the error's code and message, how long it took, and whether the phone was online or had just woken
-- the app. Only you can write or read your own lines; they go with your account if you delete it.
-- Run once in Supabase: Dashboard → SQL Editor → paste → Run. Safe to run twice.
-- To read them: select * from public.client_errors order by happened_at desc;

create table if not exists public.client_errors (
  id bigint generated always as identity primary key,
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  happened_at timestamptz not null,
  logged_at timestamptz not null default now(),
  what text not null,
  code text,
  message text,
  status int,
  ms int,
  online boolean,
  since_visible_ms int,
  agent text
);

alter table public.client_errors enable row level security;

drop policy if exists "write my errors" on public.client_errors;
create policy "write my errors" on public.client_errors
  for insert to authenticated with check (user_id = auth.uid());

drop policy if exists "read my errors" on public.client_errors;
create policy "read my errors" on public.client_errors
  for select to authenticated using (user_id = auth.uid());
