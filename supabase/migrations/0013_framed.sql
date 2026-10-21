-- squared.today — framed days: a mark on a day that mattered most (a green square), shown with a frame in
-- a darker green. The trigger leaves it alone; repainting a day another colour unframes it (the app does that).
-- Run once in Supabase: Dashboard → SQL Editor → paste → Run. Safe to run twice.

alter table public.days add column if not exists framed boolean not null default false;
