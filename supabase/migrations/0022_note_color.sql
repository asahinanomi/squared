-- squared.today — a moment's own colour (optional): the day keeps one colour, its answer; a moment can carry its own,
-- so a torn day's mix lives in its moments, never on the square. Empty means no colour, and that's fine forever.
-- Run once in Supabase: Dashboard → SQL Editor → paste → Run. Safe to run twice.

alter table public.notes add column if not exists color text check (color in ('green', 'red', 'grey'));
