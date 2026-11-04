# squared developer handbook

_last updated Nov 4, 2026_

For a human developer taking over squared.today cold. It covers how the code is built, run, deployed and kept safe. What squared *is* lives elsewhere: the product and every decision so far in `README.md`, the heroes in `docs/squared-heroes.md`, the look in `docs/design-system.md`, the words in `docs/brand-story.md`. Where squared is heading: `docs/1-big-picture.md`.

Keep this page current whenever the stack, the deploy, the database setup or a service changes. Feature details don't belong here.

## 1. The stack

| Part | What | Why |
|---|---|---|
| App | React 19 + TypeScript, built with Vite | A plain single-page app: no server code of its own, fast to build. |
| Data and sign-in | Supabase (Postgres + Auth, Google sign-in only) | One service for the account and the database; row-level security keeps each person's rows theirs. |
| Hosting | Vercel | Deploys `main` on every push; the site is static files plus two rewrites. |
| Email | Resend, called from a Supabase edge function | Emails each new feedback note to the maker. |
| Domain | GoDaddy (all DNS) | Owns squared.today. |

Other pieces: `docx` (the "export my data" Word file), Vitest (tests), oxlint (lint), Prettier (format). No UI library, no router, no state library: screens are switched in `src/Screens.tsx`, state lives in hooks under `src/state/`. Sounds are made in the browser (Web Audio, `src/lib/sound.ts`), so there are no audio files. It's a PWA (`public/manifest.webmanifest`, `public/sw.js`), installable to an iPhone home screen.

Node 22 is what it's built with.

## 2. Run it on your computer

```sh
npm install
npm run dev          # http://localhost:5173
```

With no `.env`, squared runs as a **demo**: "continue with Google" signs straight in, two years of fake days are made up (`src/lib/mock.ts`), and everything is kept in the browser only. That's how most work is tried.

To use the real account locally, copy `.env.example` to `.env` and fill in the three values from Supabase (Project Settings → API) and Google Cloud. **The real account holds real data: treat it as production.** Never reset or bulk-change it.

`npm run build` then `npx vite preview` serves the built site on http://localhost:4173, closest to what's live.

## 3. Where things are

- `src/App.tsx`: wires the pieces together. `src/Screens.tsx`: which screen shows and what each gets.
- `src/state/`: the app's state as hooks: `useAuth` (who's signed in), `useAccount` (days, notes, profile), `useDayActions` (paint, frame, mark, notes), `useMatters`, `useNavigation` (screens, zoom, back button via `useBrowserHistory`), `useLanding`, `useLock` (sign out when away), `usePaintingArrival`, `useTodayD` (a layout on trial). `app.ts`: the screen names and what the web address asked for (test links like `?welcome`).
- `src/screens/`: one file per screen (Today, Month, Life, DaysList, MyDays, Paintings, Settings…).
- `src/components/`: pieces shared by screens (PaintCanvas is the brush, WhyBubble the moment bubble, Sheet the bottom sheet…).
- `src/lib/`: no React: data (`days.ts`, `notes.ts`, `matters.ts`, `profile.ts`), saving (`save.ts`, `supabase.ts`), drawing (`brush.ts`, `painting.ts`), words (`pastWords.ts`, `paints.ts`), sound, dates.
- `src/App.css`: all styles, in one file, grouped by screen. Colours and sizes are tokens at the top of `src/index.css`.
- `supabase/migrations/`: the database, as numbered SQL files. `supabase/functions/feedback-email/`: the email function.
- `public/`: icons, manifest, service worker, `og.png` (the share card), robots and sitemap.
- `vercel.json`: the build command, the rewrites, the security headers.

## 4. The database

Tables (all in `public`, each with row-level security so a person reads and writes only their own rows): `days` (one row per painted day), `notes` (moments, with history), `profiles` (birth date, lifespan), `settings` (the daily question), `matters_entries` (what matters, one row per line, with history), `feedback`, `farewells` (why people left, no user id), `client_errors` (why a save or a screen failed).

**Changing the database:** add the next numbered file to `supabase/migrations/` (now 0024), write it so it can run twice safely (`if not exists`), then run it by hand in Supabase → SQL Editor. There's no automatic migration runner. Make the app cope until it has run (squared's code checks for a missing column and carries on), because the deploy and the SQL never happen at the same moment.

**A fresh Supabase project:** run every migration in order, 0001 upwards, in the SQL Editor; then set up Google sign-in (section 6) and the feedback function's secrets.

## 5. Deploying

- **`main` is what's live.** Every push to `main` deploys squared.today, after Vercel runs `npm run lint && npm test && npm run build` (a failure stops the deploy and the live site stays as it was).
- Every push to any branch makes a preview, which runs as the demo (no keys).
- **Vercel's free plan allows 100 deploys a day.** Batch small changes into one push. A "rate limited" deploy isn't live.
- **Rolling back:** Vercel → project `squared` → Deployments → an earlier one → "Promote to Production". Or revert the commit and push.
- The site: https://squared.today (`www` redirects to it). The backup address (same site) is https://squared-peach.vercel.app.
- The environment variables are baked in when it builds: change them in Vercel, then redeploy.

**Before every push:**

```sh
npm run build        # also type-checks (tsc -b)
npm run lint
npm test
npx prettier --no-semi --single-quote --print-width 120 --write <changed files>
```

Then look at any screen change in a real browser at phone size (390×844 and 375×667). Mobile first: the desktop layout comes later.

## 6. Services, settings and secrets

No secret values are written in this repo (it's public). Each lives only in its service:

| Service | What for | Where its settings live |
|---|---|---|
| GoDaddy | The domain and all DNS: `A @ → 76.76.21.21` and `CNAME www → cname.vercel-dns.com` (Vercel; no other A record for `@`, GoDaddy's "Parked" one must stay deleted), Resend's sending records (DKIM, SPF/MX on `send`), DMARC (`_dmarc`) | godaddy.com → My Products → squared.today → DNS |
| GitHub | The code: `asahinanomi/squared` | github.com |
| Vercel | Hosting, deploys | Project `squared` → Settings → Environment Variables: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_GOOGLE_CLIENT_ID` |
| Supabase | Account, database, edge function | Project `xsqpdmtruajdunawpxhk`. Authentication → Providers (Google) and URL Configuration (site `https://squared.today`, redirects `https://squared.today/**`, `https://squared-peach.vercel.app/**`). Edge Functions → Secrets: `RESEND_API_KEY`, `FEEDBACK_TO`, `FEEDBACK_SECRET`, optional `FEEDBACK_FROM`. Integrations → Database Webhooks (feedback → the function). |
| Google Cloud | The OAuth client for "continue with Google" | APIs & Services → Credentials. Redirect URIs: `https://xsqpdmtruajdunawpxhk.supabase.co/auth/v1/callback` and `https://squared.today/`; JavaScript origin `https://squared.today`. Its ID and secret are also entered in Supabase. |
| Resend | Sends feedback emails from `feedback@squared.today` | resend.com → API Keys, Domains |

The app talks to Supabase two ways: directly, and through `squared.today/sb/` (a Vercel rewrite), so a save that hangs one way retries the other (`src/lib/supabase.ts`).

## 7. When something breaks

- **Why saves or screens failed** is written to `client_errors`. In Supabase's SQL Editor: `select * from public.client_errors order by happened_at desc limit 50;`
- A crash shows "Something went wrong. Your squares are safe in your account." with reload (`src/components/CrashScreen.tsx`), and writes what broke to `client_errors`.
- A save that can't get through shows "Not saved…" with try again; nothing is ever kept on the device to send later (on purpose: the account is the one truth).
- Vercel → Deployments shows each build's log, if a deploy failed.

## 8. Looking after it

- **Monthly:** `npm audit` (keep it clean); download a database backup (Supabase → Database → Backups) and keep it somewhere private.
- **Supabase plan:** daily backups for 7 days need Pro.
- **Google OAuth:** if sign-in breaks, check the client's redirect URIs and that the consent screen is still published.
- **Packages:** upgrade one at a time, build and test after each.

## 9. Lessons learned (read before changing these)

- **iPhone doesn't take the cursor out of a box when you tap the page.** "Leaving keeps what you wrote" needs a catcher layer behind the box (the moment bubble's `why-catcher`), or the ✓ above the keyboard (which does blur).
- **iPhone Safari drops an animated element's layer** when its animation class goes, so it redraws and blinks. The paint square keeps its own layer (`will-change: transform`).
- **A sheet must unmount after closing** (`Sheet.tsx` waits 400ms), or an invisible backdrop blocks every tap.
- **Phone speakers can't play much below about 200Hz:** a low sound that's fine on a computer is silent on an iPhone.
- **One CSS file means one namespace:** check a class name isn't taken (`grep` it) before reusing it.
- **Web sound needs a touch first** on iPhone (`wakeSound()`), and the silent switch mutes it.
- **Test links** (`docs/test-links.md`) show rare moments (the first visit, a birthday, a new month) on any account, saving nothing.

## 10. Recipes

- **A new database column:** next migration file → run it in Supabase → read it in `src/lib/<thing>.ts`, coping if it's missing → save it through `src/lib/save.ts`.
- **A new test link:** add its name to `TESTS` in `src/state/app.ts` (so it survives Google sign-in), read it where needed, list it in `docs/test-links.md`.
- **A new sound:** try it in the sound lab first (an artifact), then add a function in `src/lib/sound.ts` like `frameSound()`, through the same master volume.
- **A new sheet:** use `<Sheet open onClose>`, a `torn-title` heading (the serif, 24px), at most one black pill.
