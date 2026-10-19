-- squared.today — delete my account, from inside the app (settings → account).
-- Run once in Supabase: Dashboard → SQL Editor → paste → Run. Safe to run twice.
-- Removes the signed-in person's account; every table of theirs (days, notes, profiles, matters, feedback)
-- references auth.users with "on delete cascade", so all of it goes with it.

create or replace function public.delete_my_account() returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception 'not signed in';
  end if;
  delete from auth.users where id = auth.uid();
end;
$$;

revoke all on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;
