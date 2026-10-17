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
3. **Month calendar** — `‹ October 2026 ›`, M–S weekday header, painted days filled with their color, today outlined in black, past unpainted days dashed, future days light grey. Each day shows its number with a tiny weekday ("Wed") under it. Hint: "tap a day to paint it".
4. **Why bubble** — after the square is filled, a white speech bubble pointing at the square: "why?" with a text box that grows as you write (paragraphs allowed) and a "done" button. Below it: "tap anywhere to skip".
5. **Meaning sheet** — tapping the underlined "meaningful" opens a bottom sheet titled "Meaningfully": *Not a good day or a bad one. Not what you got done. A day is meaningful when you were aware of it, and spent it on what matters to you.* Followed by the three color definitions and a black "close" button.

6. **The idea** — from the menu ("the idea"): a quiet page in the maker's words about why squared exists.
7. **How many squares?** — from the menu (and, in phase 2, the first time you zoom out to a life): birth date ("when were you born?") and "how long do you hope to live?" (stepper, default 95 years). Shows the total as a hero number and one quiet line: "N years · X so far · **Y left · Z%**". Stored in `profiles` (migration 0005).

Menu: my squares, the idea, how many squares?, sign out.

The UI in these screens should be kept; better treatments are welcome.

## The painting interaction (the most important part)

- A painting palette holding three colors. It should read and behave like a real paint palette, not generic buttons.
- Tapping a color loads the brush with it. The brush stays loaded until a different color is picked.
- A square is painted by dragging across it with a finger (or mouse on desktop). The color follows the stroke, like real paint on paper.
- One fixed medium brush size — no thickness picker. About two swipes should fill a square.
- The brush can paint the full square. **Tapping a square to fill it instantly is NOT acceptable. Painting is the point.**
- Any past or present day can be painted at any time (backfilling is fine). Future days can't be painted — you can't reflect on a day that hasn't happened yet. (Changed from "no date restrictions" during v1 review.)
- Painting with a clean brush makes the wells hop one after another (green, grey, red) as a quiet "pick a color" cue.
- The palette itself must show which color is loaded, since a finger covers the square while painting: each well is a shallow bowl of paint; dipping stirs that well (light and dark swirls), spills drops over its rim onto the board, and fills the brush head with that color. The palette is drawn after the owner's reference illustration: cream board, three paint bowls, dark brush with a metal band resting in the thumb notch.

## The three colors

- **Green** — I lived consciously. Good or bad, I spent the day meaningfully.
- **Grey** — I wasn't conscious. The day just slipped by.
- **Red** — I was conscious, but I didn't spend the day meaningfully.

Shades (from the phase 2 design): green `#6E9B7B`, grey `#8E8E87`, red `#C06A62`; a backfilled day (painted later than the day itself) shows one shade lighter in the zoomed-out views: `#A7C4B0`, `#AEAEA6`, `#D9A8A3`.

In the app the meanings read, in the owner's words: **green** "Here, and it mattered." · **grey** "Gone before I noticed." · **red** "Here, but wasted." They show in the "meaningfully" sheet, and as a quiet grey line (led by a small dot of that paint) under the palette each time a color is dipped (it fades after a few seconds, or as soon as painting starts).

## The why note

- Once a square is filled, a small gentle bubble appears asking "why?". The note can be as long as needed, with paragraph breaks (up to 10,000 characters). (Was a single-line input; changed during v1 review.)
- Notes keep a history: a day can hold several notes, each stamped with when it was written (stored in a `notes` table, migration 0004). They show under the palette, all open and in full, oldest → newest, each stamped like "Wed, Oct 14, 2026 · 4:52 pm". The latest note always shows; a "3 notes · hide older / show 2 older" row tucks the older ones away (remembered on that device).
- Tap a note to open it: **update** (saves the change; its time becomes now) or **delete** (a grey button; an in-app "Delete this note? It can't be undone." alert confirms). Swiping a note left also reveals a grey **delete**, with the same alert. Tapping outside leaves it as it was. Below the last note, an **add new note** button always opens an empty box. Painting a day asks "why?" as a new note.
- Notes save instantly: the box closes (button: **done**) and the note shows at once while it saves in the background. If saving fails, the change is undone and the box reopens with the text and a quiet message. Each request gives up after 10s and retries once on a fresh connection (phones can wake the app on a dead one); the sign-in is renewed as soon as the app comes back on screen.
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
| Statements and questions the app says to you | Sentence case | "did I spend Today meaningfully?" (the owner's wording), "Meaningfully" sheet, "Delete this note?" |
| Dates | Normal date capitals | "Wednesday, Oct 14th, 2026", "Wed, Oct 14, 2026 · 4:52 pm" |
| Buttons and controls | all lowercase | continue with Google, add new note, hide older, update, delete, cancel |
| Quiet helper and error text | all lowercase | why?, tap anywhere to skip, 3 notes, couldn't save, sign-in didn't finish |
| The user's own notes | as typed | — |

Proper names keep their capitals everywhere (Google, I).

## Data

- A `days` table in Supabase: `date`, `color`, `note`, and a boolean for whether the square was painted on the day itself or backfilled later (set automatically).
- Painted squares persist and reload when the app is reopened.
- The question text ("did I spend Today meaningfully?", set by 0006) is stored as a single configurable value, not hardcoded in the UI.

## Auth

Supabase Auth with Google sign-in only. No Facebook, no email/password.

## Out of scope (do NOT build)

Zoom levels (week/month/year/lifetime views), painting history before this month, voice notes, AI features, sharing or public grids, Facebook login, brush thickness options, settings screens, onboarding flows, analytics.

## Done means

- Deployed to Vercel with a live URL.
- Exact DNS records documented for pointing `squared.today` at it.

## Working agreement

Build step by step; the owner reviews and gives feedback after each step before the next one starts.

## Phase 3 — settings (in progress)

Design: the "Settings (hub)" and "Onboarding (how many squares?)" boards. Menu: today · my squares · the idea · settings · sign out (sign out stays in the menu until the account phase).

- Step 1 (done): **settings hub** — back arrow (returns to where you came from), "settings", four rows: square settings ("Oct 26, 1971 · 95 years · 34,699 squares", opens the square screen), and reminders / my data / account shown with a "soon" tag and not tappable. "squared.today" at the foot. The "how many squares?" menu item is gone.
- Step 2 (done): square settings — one shared screen, two modes (first-run "how many squares?" + "start painting", which lands on today; from settings "square settings", back arrow, saves as you change it, quiet offline cue). Moving the birth date later hides earlier painted days, never deletes them.
- Step 3 (done): life glass — replaces the hint text on every zoom level: an hourglass whose sand is your life (top = squares left, bottom = spent). Just the icon until tapped; a tap shows "14,620 days (42%) to paint!" in a soft pill — in years on a life · years, in months on a life · months and the year screen, another tap hides it. A few grains trickle on arrival and every 30 seconds (off with "reduce motion"). The glass, zoom icons and "today" are a soft dark grey (#55554F), not black. (It replaced a first try: a battery bar.)
- **what matters** (done): settings → "what matters" — two short lists, meaningful and empty, of what each kind of day looks like to you. Your compass when you paint; a reference only, it never scores or colours a day. Tap "+ add" to write an entry (a line or two, up to 120 characters; Enter or tapping away saves), tap an entry to edit, swipe it left to delete, clear it to remove it. Saves itself on this device (`squared.matters` in local storage); it moves to the account once sync exists.
- Step 4: polish & wrap-up.

## Phase 4 — pie view (done)

Design: board "16 · Pie — line art (final)". Built step by step; I check each step.

- Step 1 (done): **a life pie** — the centre of the zoom bar (between the life glass and the zoom buttons) holds a pie icon on every zoom level; tap it for the pie. On the pie, it turns into a squares icon (2×2, one filled) that takes you back to the level you came from, and both zoom buttons are greyed. All bar icons are drawn to the same height. No back arrow on the pie, just the logo and menu. Title "a life pie, in slices" (the subtitle was dropped after review, to give the pie the room). The pie is as wide as the screen allows (up to 360px; keylines stay 2px) and the legend lines up with its edges; the two scroll together when they don't fit, under a fixed title, filter and bar. Line art: 2px keylines, slices clockwise from 12 o'clock — green "lived, it mattered" · red "here, but wasted" · grey "slipped by" · light grey "lived, not painted" (lived days left blank) · blank with a dashed keyline "still to come", which prints its own "N / days to paint" when the wedge is wide enough (today counts here until it's painted, so it matches the life glass). Backfilled days count the same as on-the-day ones. A slice of 0 days isn't drawn; its legend row stays, with 0. Legend under the pie: keyline dot, label, count. "share my pie" and "download" show greyed with a "soon" tag. With no birth date yet, "how many squares?" appears on the way. The life glass's count pill now floats just above the glass (on every level), so the bar's icons never move or hide.
- Step 2 (done): **scope filter** — a quiet segmented control under the title, same chart out of three denominators: whole life (always opens here, never remembered) · since I started (first painted day → end of life; lived-not-painted and still to come counted from that day) · painted only (just the three colours, and only their three legend rows). With nothing painted, the pie is an empty keyline circle.
- Step 3 (done): **ship** — regression pass at 390×844 and 375×667 (the switch on month, year and a life in years, months and days, back to the same level each time; zoom buttons greyed on the pie; every scope adds up — whole life to the life's total; filter resets to whole life; menu from the pie; no birth date → "how many squares?" and back; the glass count leaves the switch in place), README wrapped up, PR ready to merge into `main`.
- Later (own phase): share my pie, download my pie.

## Setup (for future sessions)

1. **Supabase**: run each file in `supabase/migrations/` in order (0001, 0002, …) in the SQL Editor. It creates `settings` (holds the `question` value) and `days` (row-level security: each person sees only their own rows; `painted_on_day` is set by a trigger on first paint).
2. **Google sign-in**: Supabase → Authentication → Providers → Google, using an OAuth client from Google Cloud. Add the site URLs under Authentication → URL Configuration.
3. **Env vars** (Vercel and local `.env`, see `.env.example`): `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`. Without them, the app runs as a local demo (sign-in skipped, nothing saved).
4. **Google screen says "squared.today"** (optional): set `VITE_GOOGLE_CLIENT_ID` to the same OAuth web client's ID, and in Google Cloud add `https://squared.today` to its Authorized JavaScript origins and `https://squared.today/` to its Authorized redirect URIs. The app then signs in with Google directly (ID token + nonce → `signInWithIdToken`). Without the variable it uses Supabase's redirect, whose Google screen shows the Supabase address.

## Phase 2 — the zoom (done)

Design: https://claude.ai/artifact/PFuFHaZmJXTG82GkJsT1NH. One zoom from a day out to a life: today → month → year → a life (years → months → days). Built step by step straight to production (agreed: no other users yet).

- **Rollback point:** commit `e3cabe1` is the MVP exactly as it was live before phase 2. Vercel → Deployments → that deploy → Instant Rollback, or `git revert` the phase 2 commits.
- Step 1 (done): `profiles` table (0005), all painted days loaded (paged, 1,000 per request) with the backfilled flag, the "how many squares?" screen, design colors.
- Step 2 (done): zoom levels with in/out transitions; zoom bar (helper line + zoom out / zoom in, bottom-right); **month** ("my squares") replaces the old calendar: the current month's days (painted solid, backfilled one shade lighter, unpainted dashed, today outlined, tiny weekday under each date), months one after another in a single vertical scroll (back to the birth month, down to the current one; next month peeks in faintly below; edges fade), the big title follows the month in the middle of the screen, chevrons jump a month, the zoom bar stays fixed at the bottom. Opens centred on the current month every time (owner asked for scrolling, replacing the design's faint neighbour months). Tap a day → paint it (the day screen can now step back to any past day). Notes load a month at a time. The day screen has a quiet grey zoom-out icon bottom-right (hidden while writing a note).
- Step 3 (done): **year** — your years stacked in one scroll (birth year → this year, next year faint below; owner chose scrolling over the design's faint neighbour years), each a 6×2 grid of month-squares with rising bands (green from the bottom, then grey, then red; solid = painted on the day, lighter = backfilled; shares are of the days lived, so unpainted days stay empty on top). Current month outlined, months ahead empty, months before birth blank. Title follows the year in the middle; chevrons jump a year. Tap a month → its days. The month view's top-left now reads "‹ 2026" (back to the year) and its zoom-out goes there. Shared scroll behaviour lives in `useLadderScroll`; bands in `lib/tally.ts`. Demo mode now has ~2 years of fake days.
- Step 4 (done): **a life · in years** — every year from the birth year to the hoped-for last one on one screen (8 per row; 10 if over 100 years), banded like the year view, this year outlined, years ahead empty. Title "a life" and the subheadline "95 years · 1,140 months · 34,699 days" with "years" highlighted (months and days become links in steps 5–6). Tap a year → its months; zoom in → this year; zoom out greyed (top of the ladder). The year view's top-left reads "‹ a life". First time you zoom out to a life without a birth date, "how many squares?" appears on the way (back returns to the year; saving lands on a life).
- Step 5 (done): **a life · in months** — ~1,140 banded month-squares, 12 to a row (each row a calendar year, Jan–Dec), drawn on a canvas that only paints the rows on screen (one frame per scroll step in tests). Opens with this month's row centred, this month outlined, months before birth and ahead blank. Tap a month → its days; zoom in → this year. The subheadline is now links: tap "years" / "months" to switch (the current one is bold; "days" arrives in step 6). Squares at least 44px wide print "Oct" over "2026" (shows once pinch makes them big, step 7). A life always lands on years.
- Step 6 (done): **a life · in days** — one solid square per real day (lighter if backfilled), grouped into a labelled block per year (28 per row, a gap between years), birth to the hoped-for last day; opens with today in the middle (outlined), lived days behind, empty ahead. Canvas, only the rows on screen; tested with ~18,000 painted days: no dropped frames scrolling, 26 ms to jump to the birth year. Tap a day → a dark chip shows its date ("Friday, Oct 16th, 2026") with "open ›" to paint it. Squares 40px+ print the big date and "2026.10 Thu" (visible once pinch lands, step 7). Both canvas views share `useCanvasList`.
- Step 7 (done): **pinch everywhere** (two fingers on a phone, trackpad pinch on desktop; the phone's own page zoom is off). One straight ladder: today → month → year → a life · years → a life · months → a life · days. Pinch **out** and the zoom-out button walk it outward (greyed at days, the edge). The zoom-in button walks it back. Pinch **in** enlarges the squares where there's more to read — month: 7 → 3 a row with "16 / 2026.10 Fri"; a life in months: 12 → 6 → 4 → 3 a row with "Oct / 2026"; a life in days: 28 → 14 → 7 → 3 a row with "16 / 2026.10 Fri" — and on today, year and a life · years it steps in a level. While pinching, the view scales under the fingers; on release it moves a notch or eases back, and the square under the fingers stays put. A pinch begun on the paint square takes back the stray stroke. Zoom is never remembered: every level starts at its own size.
- After step 7: **"today"** — when today has scrolled out of view (month, year, a life in months or days, at any zoom), a "today" link appears left of the zoom buttons. Tap it and the same screen glides back to today's square (this month / this year), which pulses once; the link hides again. It stays on the screen you got lost in. Labels show as soon as they fit inside the square at a readable size (9px+): a life in months prints "Oct / 2026" from 6 a row; a life in days prints the number from 7 a row and "2026.10 Thu" at 3 a row; the space between squares grows with them (7 and 3 a row match my squares).
- **Date labels on day squares (agreed):** big date number; a small line under it. Normal size: "Thu". Zoomed in: "2026.10 Thu" (year.month, then weekday — never "Oct '26", which reads like a date). Zoomed far out: color only, no text. Applies to the month view and "a life · in days" once pinch zoom lands (steps 6–7).
- Step 8 (done): **ship** — full regression pass (paint, notes, swipe delete, instant save, every zoom level, pinch anchoring, labels, "today"), speed check with ~18,000 painted days, README wrapped up, PR merged into `main`.

## Live

- App: **https://squared.today** (Vercel; `www.squared.today` redirects here). Backup URL: https://squared-peach.vercel.app
- DNS at GoDaddy: `A @ → 76.76.21.21`, `CNAME www → cname.vercel-dns.com`. No other A/AAAA records for `@` (the GoDaddy "Parked" A record must stay deleted).
- Supabase project `xsqpdmtruajdunawpxhk`: Site URL `https://squared.today`; Redirect URLs `https://squared.today/**` and `https://squared-peach.vercel.app/**`.
- Google sign-in: the OAuth client's redirect URIs are `https://xsqpdmtruajdunawpxhk.supabase.co/auth/v1/callback` and (for direct sign-in) `https://squared.today/`; its ID and secret live in Supabase → Authentication → Providers → Google.
- Vercel env vars (Production + Preview): `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` (the publishable key of the project above). They are baked in at build time, so redeploy after changing them.
