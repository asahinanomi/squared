# Beta 1 · the web, close friends

The first of two betas (step 3 of `docs/1-big-picture.md`; beta 2 is TestFlight, `docs/6-beta2-testflight.md`).
10–15 friends nomi trusts, on squared.today (added to the home screen), for two weeks. No app to install, Android
friends too, and a fix is live in a minute. squared is not explained on purpose, to see whether it makes sense on its
own.

## Before sending

- [ ] Before beta, in `docs/2-beta-readiness.md`: Supabase Pro, the first backup download, two-factor logins.
- [ ] The list of friends (a private note: name, invited on, said yes).

## While it runs

- How often each person comes back: on how many of the last 14 days they painted a square or wrote a moment (not
  logins: people stay signed in). Paste in Supabase's SQL Editor; it only reads.

```sql
select u.email,
       u.created_at::date      as joined,
       u.last_sign_in_at::date as last_sign_in,
       (select count(*) from public.days  d where d.user_id = u.id) as squares,
       (select count(*) from public.notes n where n.user_id = u.id) as moments,
       (select count(distinct t::date) from (
          select created_at as t from public.days  where user_id = u.id
          union all
          select written_at      from public.notes where user_id = u.id
        ) a where t > now() - interval '14 days') as active_days_last_14
from auth.users u
order by u.created_at;
```

- Their answers go to Claude, sorted into: fix now, try next, parked.

## The emails

In an editable doc, in nomi's voice (casual, a fun side project, numbers as numerals):
https://claude.ai/artifact/XCBouMs5cG6owch95TTMA5

- **The invite** (send now): what to do (open squared.today, add to home screen, sign in, use it once a day for 2
  weeks), and that honest answers, even "I hated it", help most.
- **A nudge** around day 4, so nobody forgets to start.
- **7 questions** on day 14 (long enough to see a habit, short enough to remember the first days): what squared is
  for (the intuitiveness test), 3 likes, 3 confusions or stuck spots, would they keep using it, how it felt, similar
  apps they use, once or several times a day.
