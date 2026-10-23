# Beta readiness

_last updated Oct 22, 2026, 23:48 UTC_

What has to be true before squared opens to beta testers, and what comes after. Tick items as they're done.

## Done

- [x] **Saving is online first**: every change goes straight to the account; "Not saved" with try again / discard if it can't. No device copies.
- [x] **What matters, one row per line**, with history (migrations 0017, 0018).
- [x] **squared locks itself**: lock when I leave (30 sec by default, 15 or 30 min), and sign out is the menu's last line.
- [x] **Every table is locked to its owner** (row-level security on all of them). No secret keys in the app or the repo.
- [x] **Crash screen** instead of a blank page; crashes and failed saves are written to `client_errors`.
- [x] **Security headers** (content policy, no framing, HTTPS only).
- [x] **Tests run before every deploy** (lint, tests, build); a failure stops the deploy.
- [x] **Feedback limit**: 5 messages per person per day (migration 0019).
- [x] **Package audit** clean.
- [x] **Privacy, terms, questions** describe the app as it is (account only, not end-to-end encrypted, 18+).
- [x] **Export my data** and **delete my account**, both in settings.
- [x] **Code split** into small pieces (App.tsx about 150 lines).

## Before beta (nomi)

- [ ] **Supabase Pro**: daily backups kept 7 days, and the project never pauses.
- [ ] **Two-factor login** on GitHub, Vercel, Supabase, Google Cloud and the domain registrar.
- [ ] **Domain auto-renew** for squared.today.
- [ ] **First backup download**: Dashboard → Database → Backups → download, into a private folder (Google Drive or iCloud).
- [ ] **A few days of real use** on phone and computer; anything odd goes to Claude.

## Every month

- [ ] Download the latest backup to the private folder.
- [ ] `npm audit` (Claude can run it).
- [ ] Glance at `client_errors` for anything new: `select * from public.client_errors order by happened_at desc limit 50;`

## When real users join

- [ ] **Private notes (end-to-end encryption)**: top priority after beta; see `docs/future-ideas.md`.
- [ ] **Automatic weekly backup**: a separate private repo (`squared-backups`) exports the database weekly, encrypted with a password only nomi knows. About 30 minutes to set up.
- [ ] **Vercel Pro** if squared ever charges (the free plan is for non-commercial use).
- [ ] **Privacy page**: name the region the data lives in, for testers in the EU.
- [ ] Watch Supabase usage (database size, monthly active users) against the plan.

## Not planned (on purpose)

- **Captcha** on feedback: the daily limit is enough, and it would add a third-party script.
- **Offline painting**: saving needs a connection, so nothing ever hides on a device.
- **End-to-end encryption** of notes: much more complex; the privacy page says plainly that it isn't.
