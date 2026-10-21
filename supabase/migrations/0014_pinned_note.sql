-- squared.today — a framed day's note, pinned: "what do you want to remember?". A pinned note always
-- shows first among the day's notes, in the frame's dark green. Unframing the day unpins it (the app does that).
-- Run once in Supabase: Dashboard → SQL Editor → paste → Run. Safe to run twice.

alter table public.notes add column if not exists pinned boolean not null default false;
