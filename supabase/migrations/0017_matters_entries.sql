-- squared.today — what matters, one row per line. Each line added, edited, deleted or moved saves on its own, so
-- edits from two devices add up instead of one list overwriting the other. Your current lists are copied in.
-- Every earlier version of a line is kept in matters_entries_history (a trigger on each change or delete).
-- Run once in Supabase: Dashboard → SQL Editor → paste → Run. Safe to run twice. The old matters table stays as it
-- is (nothing is deleted).

create table if not exists public.matters_entries (
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  id         text not null,
  kind       text not null check (kind in ('meaningful', 'wasted')),
  text       text not null,
  position   double precision not null default 0,
  updated_at timestamptz not null default now(),
  primary key (user_id, id)
);

alter table public.matters_entries enable row level security;

drop policy if exists "own lines: select" on public.matters_entries;
drop policy if exists "own lines: insert" on public.matters_entries;
drop policy if exists "own lines: update" on public.matters_entries;
drop policy if exists "own lines: delete" on public.matters_entries;
create policy "own lines: select" on public.matters_entries for select to authenticated using (user_id = auth.uid());
create policy "own lines: insert" on public.matters_entries for insert to authenticated with check (user_id = auth.uid());
create policy "own lines: update" on public.matters_entries for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own lines: delete" on public.matters_entries for delete to authenticated using (user_id = auth.uid());

-- History: the version a change or delete replaces.
create table if not exists public.matters_entries_history (
  hid         bigint generated always as identity primary key,
  user_id     uuid not null references auth.users (id) on delete cascade,
  id          text not null,
  kind        text not null,
  text        text not null,
  position    double precision,
  updated_at  timestamptz,
  archived_at timestamptz not null default now(),
  deleted     boolean not null default false
);
alter table public.matters_entries_history enable row level security;
drop policy if exists "read my line history" on public.matters_entries_history;
create policy "read my line history" on public.matters_entries_history
  for select to authenticated using (user_id = auth.uid());

create or replace function public.keep_matters_entries_history() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'DELETE' or old.text is distinct from new.text or old.kind is distinct from new.kind then
    insert into public.matters_entries_history (user_id, id, kind, text, position, updated_at, deleted)
    values (old.user_id, old.id, old.kind, old.text, old.position, old.updated_at, tg_op = 'DELETE');
  end if;
  return coalesce(new, old);
end $$;

drop trigger if exists matters_entries_history on public.matters_entries;
create trigger matters_entries_history before update or delete on public.matters_entries
  for each row execute function public.keep_matters_entries_history();

-- Copy the current lists in (each line once, in its order).
insert into public.matters_entries (user_id, id, kind, text, position)
select m.user_id, coalesce(e->>'id', gen_random_uuid()::text), 'meaningful', e->>'text', t.ord
from public.matters m, jsonb_array_elements(m.meaningful) with ordinality as t(e, ord)
where coalesce(trim(e->>'text'), '') <> ''
on conflict (user_id, id) do nothing;

insert into public.matters_entries (user_id, id, kind, text, position)
select m.user_id, coalesce(e->>'id', gen_random_uuid()::text), 'wasted', e->>'text', t.ord
from public.matters m, jsonb_array_elements(m.wasted) with ordinality as t(e, ord)
where coalesce(trim(e->>'text'), '') <> ''
on conflict (user_id, id) do nothing;
