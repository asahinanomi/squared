-- squared.today — a daily limit on feedback, so "get in touch" can't be used to flood the maker's inbox: at most
-- 5 messages per person in any 24 hours. A sixth is turned away with "feedback limit" (the app says to try
-- tomorrow). Run once in Supabase: Dashboard → SQL Editor → paste → Run. Safe to run twice.

create or replace function public.feedback_limit() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if (select count(*) from public.feedback
      where user_id = new.user_id and created_at > now() - interval '24 hours') >= 5 then
    raise exception 'feedback limit' using errcode = 'P0001';
  end if;
  return new;
end $$;

drop trigger if exists feedback_limit on public.feedback;
create trigger feedback_limit before insert on public.feedback
  for each row execute function public.feedback_limit();
