-- squared.today — delete my account works again for anyone with lines in what matters.
-- Deleting an account deletes its what matters lines (on delete cascade), and the history trigger (0017) then tried to
-- keep a copy of each line for an account that was already gone, so the database refused the whole delete. Now the
-- history only keeps a copy while the account still exists.
-- Run once in Supabase: Dashboard → SQL Editor → paste → Run. Safe to run twice.

create or replace function public.keep_matters_entries_history() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if (tg_op = 'DELETE' or old.text is distinct from new.text or old.kind is distinct from new.kind)
     and exists (select 1 from auth.users where id = old.user_id) then
    insert into public.matters_entries_history (user_id, id, kind, text, position, updated_at, deleted)
    values (old.user_id, old.id, old.kind, old.text, old.position, old.updated_at, tg_op = 'DELETE');
  end if;
  return coalesce(new, old);
end $$;
