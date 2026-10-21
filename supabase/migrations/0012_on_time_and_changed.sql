-- squared.today — on time is the day itself or the next day (until midnight), in the painter's own time
-- zone; later than that a first paint is late (the lighter shade). And a square remembers when its
-- colour last changed (changed_at), so a repaint after that window can say so: "changed Oct 23".
-- Run once in Supabase: Dashboard → SQL Editor → paste → Run. Safe to run twice.

alter table public.days add column if not exists changed_at timestamptz;

create or replace function public.days_stamp() returns trigger
language plpgsql as $$
declare
  tz text;
begin
  if tg_op = 'INSERT' then
    tz := case when exists (select 1 from pg_timezone_names where name = new.time_zone)
               then new.time_zone else 'UTC' end;
    new.time_zone := tz;
    -- Local time now, before the end of the day after the square's date.
    new.painted_on_day := (now() at time zone tz) < new.date + interval '2 days';
    new.created_at := now();
    new.changed_at := null;
    new.note_at := case when new.note is null then null else now() end;
  else
    new.painted_on_day := old.painted_on_day;
    new.time_zone := old.time_zone;
    new.created_at := old.created_at;
    -- Only a new colour counts as a change (painting the same colour again doesn't).
    new.changed_at := case when new.color is distinct from old.color then now() else old.changed_at end;
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

-- Squares already painted: re-check them by when they were first painted, and take their last update as
-- the last change (a repaint, before changed_at existed). The trigger would undo both, so step around it.
alter table public.days disable trigger days_stamp;
update public.days
   set painted_on_day = (created_at at time zone time_zone) < date + interval '2 days'
 where painted_on_day is distinct from ((created_at at time zone time_zone) < date + interval '2 days');
update public.days
   set changed_at = updated_at
 where changed_at is null and updated_at > created_at + interval '1 minute';
alter table public.days enable trigger days_stamp;
