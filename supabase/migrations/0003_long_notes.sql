-- squared.today — allow long, multi-paragraph notes (was 280 characters).
-- Run once in Supabase: Dashboard → SQL Editor → paste → Run. Safe to run twice.

alter table public.days drop constraint if exists days_note_check;
alter table public.days drop constraint if exists days_note_length;
alter table public.days add constraint days_note_length check (char_length(note) <= 10000);
