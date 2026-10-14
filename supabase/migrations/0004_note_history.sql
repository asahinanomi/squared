-- squared.today — note history: a day can hold many notes, each with its own time.
-- Run once in Supabase: Dashboard → SQL Editor → paste → Run. Safe to run twice.
-- Existing notes (days.note) are copied in; days.note is left untouched as a backup.

create table if not exists public.notes (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  date        date not null,
  body        text not null check (char_length(body) between 1 and 10000),
  -- when this note was last written (set on create, refreshed when the text is replaced)
  written_at  timestamptz not null default now()
);

create index if not exists notes_user_date on public.notes (user_id, date, written_at);

alter table public.notes enable row level security;

drop policy if exists "own notes: select" on public.notes;
drop policy if exists "own notes: insert" on public.notes;
drop policy if exists "own notes: update" on public.notes;
drop policy if exists "own notes: delete" on public.notes;
create policy "own notes: select" on public.notes for select to authenticated using (user_id = auth.uid());
create policy "own notes: insert" on public.notes for insert to authenticated with check (user_id = auth.uid());
create policy "own notes: update" on public.notes for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own notes: delete" on public.notes for delete to authenticated using (user_id = auth.uid());

-- The server owns the timestamp: now() on create, now() again when the text changes.
create or replace function public.notes_stamp() returns trigger
language plpgsql as $$
begin
  if tg_op = 'INSERT' then
    new.written_at := now();
  else
    new.user_id := old.user_id;
    new.date := old.date;
    new.written_at := case when new.body is distinct from old.body then now() else old.written_at end;
  end if;
  return new;
end;
$$;

drop trigger if exists notes_stamp on public.notes;
create trigger notes_stamp
  before insert or update on public.notes
  for each row execute function public.notes_stamp();

-- Copy existing one-per-day notes in, keeping their original time where known.
-- (The trigger would stamp them "now", so it is paused for this one copy.)
alter table public.notes disable trigger notes_stamp;
insert into public.notes (user_id, date, body, written_at)
select d.user_id, d.date, d.note,
       coalesce(to_jsonb(d) ->> 'note_at', d.updated_at::text)::timestamptz
from public.days d
where d.note is not null and char_length(d.note) between 1 and 10000
  and not exists (select 1 from public.notes n where n.user_id = d.user_id and n.date = d.date);
alter table public.notes enable trigger notes_stamp;
