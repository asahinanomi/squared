-- squared.today — the old "what matters" table goes. Since 0017 the lists live one row per line in
-- matters_entries (with their own history in matters_entries_history); nothing reads the old single row any more.
-- Removes the old table, its history table (0016) and that history's trigger function.
-- Run once in Supabase: Dashboard → SQL Editor → paste → Run. Safe to run twice.

drop table if exists public.matters_history;
drop table if exists public.matters; -- its history trigger goes with it
drop function if exists public.keep_matters_history();
