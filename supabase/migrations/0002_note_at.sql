-- squared.today — remember when the "why?" note was written.
-- Run once in Supabase: Dashboard → SQL Editor → paste → Run. Safe to run twice.

alter table public.days add column if not exists note_at timestamptz;

create or replace function public.days_stamp() returns trigger
language plpgsql as $$
declare
  tz text;
begin
  if tg_op = 'INSERT' then
    tz := case when exists (select 1 from pg_timezone_names where name = new.time_zone)
               then new.time_zone else 'UTC' end;
    new.time_zone := tz;
    new.painted_on_day := new.date = (now() at time zone tz)::date;
    new.created_at := now();
    new.note_at := case when new.note is null then null else now() end;
  else
    new.painted_on_day := old.painted_on_day;
    new.time_zone := old.time_zone;
    new.created_at := old.created_at;
    new.note_at := case
      when new.note is null then null
      when new.note is distinct from old.note then now()
      else old.note_at
    end;
  end if;
  new.updated_at := now();
  return new;
end;
$$;
