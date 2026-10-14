# squared.today

A quiet, minimal app where I paint one square per day with a color for how I spent that day. I'm the only user. This is version one — build exactly what's here and nothing more.

## Platform

- Mobile-first responsive web app (PWA), not a native app.
- Must install to an iPhone home screen.
- Used mostly on phone; desktop should work too.

## Stack

- React + Vite + TypeScript
- Supabase for database and auth
- Deployed to Vercel
- GitHub repo: `asahinanomi/squared`

## Screens (from the design mockups)

1. **Sign in** — dotted-grid background, logo mark (rounded square with a paint wave), wordmark `squared` + grey `.today`, a black pill button "continue with Google" (Google's official G mark goes in the circle).
2. **Today / paint** — logo top-left, hamburger top-right. Question "Was it meaningful?" with a dotted underline on "meaningful", big "today" below it, then `‹ Monday, Oct 12th, 2026 ›` day navigation. One large square to paint in the center; the month grid is faintly visible behind it. A paint palette (three wells + brush) sits under the square.
3. **Month calendar** — `‹ October 2026 ›`, M–S weekday header, painted days filled with their color, today outlined in black, past unpainted days dashed, future days light grey. Hint: "tap a day to paint it".
4. **Why bubble** — after the square is filled, a white speech bubble pointing at the square: "why?" with a text box that grows as you write (paragraphs allowed) and a "done" button. Below it: "tap anywhere to skip".
5. **Meaning sheet** — tapping the underlined "meaningful" opens a bottom sheet titled "Meaningfully": *Not a good day or a bad one. Not what you got done. A day is meaningful when you were aware of it, and spent it on what matters to you.* Followed by the three color definitions and a black "close" button.

6. **The idea** — from the menu ("the idea"): a quiet page in the maker's words about why squared exists. Menu now holds: my squares (the month calendar), the idea, sign out.

The UI in these screens should be kept; better treatments are welcome.

## The painting interaction (the most important part)

- A painting palette holding three colors. It should read and behave like a real paint palette, not generic buttons.
- Tapping a color loads the brush with it. The brush stays loaded until a different color is picked.
- A square is painted by dragging across it with a finger (or mouse on desktop). The color follows the stroke, like real paint on paper.
- One fixed medium brush size — no thickness picker. About two swipes should fill a square.
- The brush can paint the full square. **Tapping a square to fill it instantly is NOT acceptable. Painting is the point.**
- Any past or present day can be painted at any time (backfilling is fine). Future days can't be painted — you can't reflect on a day that hasn't happened yet. (Changed from "no date restrictions" during v1 review.)
- The palette itself must show which color is loaded, since a finger covers the square while painting: the dipped well shows a scooped dent and the brush head fills with that color. Wells are domed wet paint with a soft shine; the brush has a glossy handle and metal band.

## The three colors

- **Green** — I lived consciously. Good or bad, I spent the day meaningfully.
- **Grey** — I wasn't conscious. The day just slipped by.
- **Red** — I was conscious, but I didn't spend the day meaningfully.

Pleasant, muted shades; to be refined later.

## The why note

- Once a square is filled, a small gentle bubble appears asking "why?". The note can be as long as needed, with paragraph breaks (up to 10,000 characters). (Was a single-line input; changed during v1 review.)
- Notes keep a history: a day can hold several notes, each stamped with when it was written (stored in a `notes` table, migration 0004). They show under the palette, all open and in full, oldest → newest, each stamped like "Wed, Oct 14, 2026 · 4:52 pm". The latest note always shows; a "3 notes · hide older / show 2 older" row tucks the older ones away (remembered on that device).
- Tap a note to open it: **update** (saves the change; its time becomes now) or **delete** (a grey button; an in-app "Delete this note? It can't be undone." alert confirms). Swiping a note left also reveals a grey **delete**, with the same alert. Tapping outside leaves it as it was. Below the last note, an **add new note** button always opens an empty box. Painting a day asks "why?" as a new note.
- Notes only close once saved; if saving fails, the text stays in the box with a quiet message.
- Easy to dismiss — tapping outside closes it; skipping is fine. Never required, never nagging.
- Text only. No voice recording.

## Visual rules (strict)

- The only color anywhere in the app is in the painted squares and the palette. Everything else is black, white and grey.
- Large, very readable type. Generous spacing. Calm and quiet.
- No badges, streaks, counters, confetti, notifications or celebration of any kind. This is a reflection tool, not a productivity app.
- An unpainted day stays blank. No guilt messages, no broken-streak warnings.

## Capitalization

| Kind of text | Style | Examples |
|---|---|---|
| Statements and questions the app says to you | Sentence case | "Did I spend today meaningfully?", "Meaningfully" sheet, "Delete this note?" |
| Dates | Normal date capitals | "Wednesday, Oct 14th, 2026", "Wed, Oct 14, 2026 · 4:52 pm" |
| Buttons and controls | all lowercase | continue with Google, add new note, hide older, update, delete, cancel |
| Quiet helper and error text | all lowercase | why?, tap anywhere to skip, 3 notes, couldn't save, sign-in didn't finish |
| The user's own notes | as typed | — |

Proper names keep their capitals everywhere (Google, I).

## Data

- A `days` table in Supabase: `date`, `color`, `note`, and a boolean for whether the square was painted on the day itself or backfilled later (set automatically).
- Painted squares persist and reload when the app is reopened.
- The question text ("Did I spend today meaningfully?") is stored as a single configurable value, not hardcoded in the UI.

## Auth

Supabase Auth with Google sign-in only. No Facebook, no email/password.

## Out of scope (do NOT build)

Zoom levels (week/month/year/lifetime views), painting history before this month, voice notes, AI features, sharing or public grids, Facebook login, brush thickness options, settings screens, onboarding flows, analytics.

## Done means

- Deployed to Vercel with a live URL.
- Exact DNS records documented for pointing `squared.today` at it.

## Working agreement

Build step by step; the owner reviews and gives feedback after each step before the next one starts.

## Setup (for future sessions)

1. **Supabase**: run each file in `supabase/migrations/` in order (0001, 0002, …) in the SQL Editor. It creates `settings` (holds the `question` value) and `days` (row-level security: each person sees only their own rows; `painted_on_day` is set by a trigger on first paint).
2. **Google sign-in**: Supabase → Authentication → Providers → Google, using an OAuth client from Google Cloud. Add the site URLs under Authentication → URL Configuration.
3. **Env vars** (Vercel and local `.env`, see `.env.example`): `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`. Without them, the app runs as a local demo (sign-in skipped, nothing saved).

## Live

- App: **https://squared.today** (Vercel; `www.squared.today` redirects here). Backup URL: https://squared-peach.vercel.app
- DNS at GoDaddy: `A @ → 76.76.21.21`, `CNAME www → cname.vercel-dns.com`. No other A/AAAA records for `@` (the GoDaddy "Parked" A record must stay deleted).
- Supabase project `xsqpdmtruajdunawpxhk`: Site URL `https://squared.today`; Redirect URLs `https://squared.today/**` and `https://squared-peach.vercel.app/**`.
- Google sign-in: the OAuth client's only redirect URI is `https://xsqpdmtruajdunawpxhk.supabase.co/auth/v1/callback`; its ID and secret live in Supabase → Authentication → Providers → Google.
- Vercel env vars (Production + Preview): `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` (the publishable key of the project above). They are baked in at build time, so redeploy after changing them.
