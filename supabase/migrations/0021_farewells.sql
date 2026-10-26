-- squared.today — "why are you leaving?": an optional line in the delete alert, kept with no name attached, so it
-- outlives the account. And feedback sent before stays too: deleting an account now takes the name off it instead
-- of deleting it.
-- Run once in Supabase: Dashboard → SQL Editor → paste → Run. Safe to run twice.
-- Read them in Dashboard → Table Editor → farewells (and feedback, where a deleted account's rows have no user_id).

-- 1. The farewells: just the words and when. No user_id, no way back to who wrote them.
create table if not exists public.farewells (
  id          uuid primary key default gen_random_uuid(),
  body        text not null check (char_length(body) between 1 and 2000),
  created_at  timestamptz not null default now()
);
alter table public.farewells enable row level security;
-- No policies: nobody can read or write it from the app. Only delete_my_account (below) writes to it.

-- 2. Feedback outlives its account, with the name taken off.
alter table public.feedback alter column user_id drop not null;
alter table public.feedback drop constraint if exists feedback_user_id_fkey;
alter table public.feedback
  add constraint feedback_user_id_fkey foreign key (user_id) references auth.users (id) on delete set null;

-- 3. Delete my account, with an optional reason. Replaces the one from 0011 (same name, now one optional argument).
drop function if exists public.delete_my_account();
create or replace function public.delete_my_account(reason text default null) returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception 'not signed in';
  end if;
  if nullif(btrim(reason), '') is not null then
    insert into public.farewells (body) values (left(btrim(reason), 2000));
  end if;
  delete from auth.users where id = auth.uid();
end;
$$;

revoke all on function public.delete_my_account(text) from public, anon;
grant execute on function public.delete_my_account(text) to authenticated;
