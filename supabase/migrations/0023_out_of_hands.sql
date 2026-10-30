-- squared.today — "out of my hands": a mark on a painted day, like framing. Some days aren't yours to choose (an
-- accident, a loss, someone else's choice); the colour stays the honest answer, and the mark makes sure the day is
-- never called a regret. Off by default.
-- Run once in Supabase: Dashboard → SQL Editor → paste → Run. Safe to run twice.

alter table public.days add column if not exists out_of_hands boolean not null default false;
