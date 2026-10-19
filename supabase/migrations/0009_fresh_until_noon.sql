-- squared.today — a first paint is fresh (full colour) on the day itself, or the next morning
-- until noon, in the painter's own time zone. Later than that it is backfilled (the lighter shade).
-- Run once in Supabase: Dashboard → SQL Editor → paste → Run. Safe to run twice.

create or replace function public.days_stamp() returns trigger
language plpgsql as $$
declare
  tz text;
begin
  if tg_op = 'INSERT' then
    tz := case when exists (select 1 from pg_timezone_names where name = new.time_zone)
               then new.time_zone else 'UTC' end;
    new.time_zone := tz;
    -- Local time now, before noon of the day after the square's date.
    new.painted_on_day := (now() at time zone tz) < new.date + interval '1 day 12 hours';
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

-- Squares already painted: re-check them by when they were first painted (created_at never
-- changes on a repaint). The trigger would keep the old answer on update, so step around it.
alter table public.days disable trigger days_stamp;
update public.days
   set painted_on_day = (created_at at time zone time_zone) < date + interval '1 day 12 hours'
 where painted_on_day is distinct from ((created_at at time zone time_zone) < date + interval '1 day 12 hours');
alter table public.days enable trigger days_stamp;
