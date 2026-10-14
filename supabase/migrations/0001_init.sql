-- squared.today — v1 schema
-- Run once in Supabase: Dashboard → SQL Editor → paste → Run.

-- ---------------------------------------------------------------------------
-- settings: single configurable values (e.g. the question text)
-- ---------------------------------------------------------------------------
create table if not exists public.settings (
  key   text primary key,
  value text not null
);

alter table public.settings enable row level security;

drop policy if exists "settings are readable by signed-in users" on public.settings;
create policy "settings are readable by signed-in users"
  on public.settings for select
  to authenticated
  using (true);

insert into public.settings (key, value)
values ('question', 'Did I spend today meaningfully?')
on conflict (key) do nothing;

-- ---------------------------------------------------------------------------
-- days: one painted square per person per date
-- ---------------------------------------------------------------------------
create table if not exists public.days (
  user_id         uuid not null default auth.uid() references auth.users (id) on delete cascade,
  date            date not null,
  color           text not null check (color in ('green', 'grey', 'red')),
  note            text check (char_length(note) <= 280),
  -- true when the square was first painted on the day itself, false when backfilled.
  painted_on_day  boolean not null default false,
  -- the painter's IANA time zone, so "the day itself" means their day, not UTC's.
  time_zone       text not null default 'UTC',
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  primary key (user_id, date)
);

alter table public.days enable row level security;

drop policy if exists "own days: select" on public.days;
drop policy if exists "own days: insert" on public.days;
drop policy if exists "own days: update" on public.days;
drop policy if exists "own days: delete" on public.days;
create policy "own days: select" on public.days for select to authenticated using (user_id = auth.uid());
create policy "own days: insert" on public.days for insert to authenticated with check (user_id = auth.uid());
create policy "own days: update" on public.days for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own days: delete" on public.days for delete to authenticated using (user_id = auth.uid());

-- Set painted_on_day automatically on first paint (repaints keep the original
-- answer), and keep updated_at fresh. The client can't set either directly.
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
  else
    new.painted_on_day := old.painted_on_day;
    new.time_zone := old.time_zone;
    new.created_at := old.created_at;
  end if;
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists days_stamp on public.days;
create trigger days_stamp
  before insert or update on public.days
  for each row execute function public.days_stamp();
