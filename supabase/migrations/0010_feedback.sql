-- squared.today — "send feedback": what testers tell the maker, written from inside the app.
-- Run once in Supabase: Dashboard → SQL Editor → paste → Run. Safe to run twice.
-- Adds one table; nothing existing is touched. Read it in Dashboard → Table Editor → feedback.

create table if not exists public.feedback (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  body        text not null check (char_length(body) between 1 and 4000),
  created_at  timestamptz not null default now()
);

alter table public.feedback enable row level security;

-- Anyone signed in can send; nobody can read others' (the maker reads it in the dashboard).
drop policy if exists "own feedback: insert" on public.feedback;
drop policy if exists "own feedback: select" on public.feedback;
create policy "own feedback: insert" on public.feedback for insert to authenticated with check (user_id = auth.uid());
create policy "own feedback: select" on public.feedback for select to authenticated using (user_id = auth.uid());

-- For reading: each note with who sent it and when, newest first (Dashboard → SQL Editor:
-- `select * from feedback_inbox;`). Only the dashboard (service role) can read it, never the app.
create or replace view public.feedback_inbox with (security_invoker = true) as
  select f.created_at, u.email, f.body
  from public.feedback f
  join auth.users u on u.id = f.user_id
  order by f.created_at desc;
revoke all on public.feedback_inbox from anon, authenticated;
