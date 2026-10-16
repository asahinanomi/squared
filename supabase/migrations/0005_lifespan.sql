-- squared.today — phase 2: how many squares? (birth date + hoped-for lifespan)
-- Run once in Supabase: Dashboard → SQL Editor → paste → Run. Safe to run twice.
-- Adds one table; nothing existing is touched.

create table if not exists public.profiles (
  user_id     uuid primary key default auth.uid() references auth.users (id) on delete cascade,
  born        date not null check (born > '1900-01-01' and born <= current_date),
  lifespan    smallint not null default 95 check (lifespan between 1 and 130),
  updated_at  timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "own profile: select" on public.profiles;
drop policy if exists "own profile: insert" on public.profiles;
drop policy if exists "own profile: update" on public.profiles;
create policy "own profile: select" on public.profiles for select to authenticated using (user_id = auth.uid());
create policy "own profile: insert" on public.profiles for insert to authenticated with check (user_id = auth.uid());
create policy "own profile: update" on public.profiles for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

create or replace function public.profiles_stamp() returns trigger
language plpgsql as $$
begin
  new.user_id := coalesce(old.user_id, new.user_id);
  new.updated_at := now();
  return new;
end $$;

drop trigger if exists profiles_stamp on public.profiles;
create trigger profiles_stamp before insert or update on public.profiles
  for each row execute function public.profiles_stamp();
