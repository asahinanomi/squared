# Beta 1 · the web, close friends

The first of two betas (step 3 of `docs/1-big-picture.md`; beta 2 is TestFlight, `docs/6-beta2-testflight.md`).
10–15 friends nomi trusts, on squared.today (added to the home screen), for two weeks. No app to install, Android
friends too, and a fix is live in a minute. squared is not explained on purpose, to see whether it makes sense on its
own.

## Before sending

- [ ] Before beta, in `docs/2-beta-readiness.md`: Supabase Pro, the first backup download, two-factor logins.
- [ ] The list of friends (a private note: name, invited on, said yes).

## While it runs

### Who joined, and what's happening (Supabase, read only)

Everything below only reads. Paste a query into Supabase → SQL Editor → Run. Counts, never their words: what people
write in squared is theirs, so the queries never show a moment's text.

- **New people, at a glance:** Supabase → Authentication → Users. Each row: the email, when they joined ("Created"),
  when they last signed in. Click "Created" to put the newest first.
- **Who joined, newest first** (with when they first painted):

```sql
select u.email,
       u.created_at                         as joined,
       (select min(created_at) from public.days d where d.user_id = u.id) as first_square
from auth.users u
order by u.created_at desc;
```

- **Today, so far: who** painted or wrote anything today (UTC), with how many squares and moments each:

```sql
select u.email,
       count(*) filter (where a.kind = 'square') as squares_today,
       count(*) filter (where a.kind = 'moment') as moments_today,
       max(a.t)                                  as last_at
from (
  select user_id, 'square' as kind, greatest(created_at, coalesce(changed_at, created_at)) as t
    from public.days  where created_at >= current_date or changed_at >= current_date
  union all
  select user_id, 'moment', written_at from public.notes where written_at >= current_date
) a
join auth.users u on u.id = a.user_id
group by u.email
order by last_at desc;
```

- **Messages from "get in touch":** they're emailed to you as they arrive; the full list is
  `select created_at, body from public.feedback order by created_at desc;`
- **Something went wrong for someone:** `select * from public.client_errors order by happened_at desc limit 50;`
  (a failed save or a crash, with the browser; see `docs/4-developer-handbook.md` → "When something breaks").
- **Someone left:** `select created_at, body from public.farewells order by created_at desc;` (why they left, if they said; no name on it).

### How often each person comes back

- How often each person comes back, **one row per person, with their email**: on how many of the last 14 days they painted a square or wrote a moment (not
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

## Support

One door, read every day, a personal reply. At this size, the reply is the support.

**Where messages come in**
- **In the app:** about → get in touch, or the link **squared.today/?touch** in the beta email. Each message lands in the
  `feedback` table (5 a day per person at most) and arrives in nomi's email straight away.
- **Directly:** friends will also text. Copy those into the same place (or a note), so nothing is lost.
- **Silently:** anything that breaks without a word is logged in `client_errors`.

**Reading them** (Supabase → SQL Editor; both only read):

```sql
select * from feedback_inbox;                                        -- every message, newest first, with the sender's email
select * from public.client_errors order by happened_at desc limit 50; -- what broke quietly
```

**The routine**
1. **A message arrives** (email, live). Glance at it; the urgent ones can't wait (below), the rest wait for the evening.
2. **Every evening**, once: the inbox and `client_errors` together.
3. **Sort each message** into one of three:
   - **Bug** (something broke): ask for a screenshot or a screen recording if it isn't clear, then bring it to Claude.
     Fixed, deployed, then the reply: "fixed, try again".
   - **Confusion** (they didn't understand something): design feedback, the most valuable kind. Note it; when two
     people trip on the same thing, change it.
   - **Idea** (they want something): `docs/future-ideas.md`, with their name. Not built during the freeze; count repeats.
4. **Reply personally within a day or two**, from nomi's own email, signed "— nomi".
5. **Close the loop:** when something they told you is fixed, tell them. That's what keeps friends telling you.

**Same day, never waiting**
- "I can't sign in" and "my days are gone" (or anything about losing what they wrote).
- Never change someone's data without asking them first, the same rule as nomi's own account.

**Later (beta 2, strangers):** a short support page and a reply template; not needed for friends.

## The emails

In an editable doc, in nomi's voice (casual, a fun side project, numbers as numerals):
https://claude.ai/artifact/XCBouMs5cG6owch95TTMA5

- **The invite** (send now): what to do (open squared.today, add to home screen, sign in, use it once a day for 2
  weeks), and that honest answers, even "I hated it", help most.
- **A nudge** around day 4, so nobody forgets to start.
- **7 questions** on day 14 (long enough to see a habit, short enough to remember the first days): what squared is
  for (the intuitiveness test), 3 likes, 3 confusions or stuck spots, would they keep using it, how it felt, similar
  apps they use, once or several times a day.
