# Test links

_last updated Nov 3, 2026, 06:15 UTC_

Hidden links for trying squared's first-time moments on your own account. Open them on your phone while signed in. They save nothing.

| Link | What it shows |
|---|---|
| [squared.today/?welcome](https://squared.today/?welcome) | The first visit's sheet over today: each square is a day, the three colours, "got it". (Onboarding's four steps are gone since Oct 25, 2026.) |
| [squared.today/?month](https://squared.today/?month) | Last month's painting (the new-month moment). Works any day. |
| [squared.today/?year](https://squared.today/?year) | Last year's painting (the new-year moment). Works any day. |
| [squared.today/?birthday](https://squared.today/?birthday) | The birthday sheet over today ("Happy 55th birthday.", from your birth date; "Happy birthday." without one). Works any day. |
| [squared.today/?firstlife](https://squared.today/?firstlife) | The first zoom out to a life, again: the slower first fill (about 4s) and two pulses (normally once per device). |
| [squared.today/?askfirst](https://squared.today/?askfirst) | my days with the plain what-matters question: "What makes a day worth it to you?" (no skip). Answering only hides it. |
| [squared.today/?askweek](https://squared.today/?askweek) | my days with the week's question: "a week painted" / "What made the green ones green?", with skip. Answering or skipping only hides it. |
| [squared.today/?askred](https://squared.today/?askred) | my days with the first red day's question: "What would you regret?", with skip. Answering or skipping only hides it. |
| [squared.today/?today=d](https://squared.today/?today=d) | Today's layout D, on trial (lab row 14): the square first, a little smaller, the moment box under the palette. Open it once in Safari while signed in: it's saved to your account, so the home screen app follows (it keeps its own storage and opens at plain squared.today). [?today=now](https://squared.today/?today=now) turns it off the same way. Rollback point if D goes: commit 3743f11. |

## my days' what-matters card: when each question shows

my days checks these top to bottom and shows only the first that's true. The links above force one (saving nothing); these are the real rules, to check on a real account.

**Case 1: the week question** (?askweek)
- When: 7 or more painted days in total (any dates), at least one green, and not yet answered or skipped on this account.
- Shows: "a week painted" / "What made the green ones green?", a writing box, "skip".
- After: the answer goes into worth it. Answered or skipped, never again.

**Case 2: the regret question** (?askred)
- When: case 1 isn't showing; at least one red day not marked out of my hands; the regret list is empty; not yet answered or skipped.
- Shows: "what matters" / "What would you regret?", a writing box, "skip".
- After: the answer goes into regret. Answered or skipped, never again.

**Case 3: the first question** (?askfirst)
- When: neither above shows, and the worth it list is empty.
- Shows: "what matters" / "What makes a day worth it to you?", a writing box (no skip).
- After: the answer goes into worth it, then case 4.

**Case 4: no question**
- When: none of the above, and worth it has lines.
- Shows: "you said this matters" with one of your lines; tap it for both lists.

"Answered or skipped" is remembered per account (in the account, and on the device), so a second account on the same phone is asked on its own.

## For testers

- [squared.today/?touch](https://squared.today/?touch) opens "get in touch" (about's tab), after signing in if need be. The link in the beta notes, so testers write without hunting through the menu.

## Pages anyone can open (signed in or not)

- [squared.today/idea](https://squared.today/idea) (the letter; signed in, the about page)
- [squared.today/faq](https://squared.today/faq)
- [squared.today/privacy](https://squared.today/privacy)
- [squared.today/terms](https://squared.today/terms)

Signed out? Open the link anyway: it survives the trip through Google sign-in (kept on the device for 10 minutes, used once), so you land on the test after signing in. (Fixed Oct 24, 2026: with "lock when I leave", you're often signed out, and Google returns to the bare address.)
