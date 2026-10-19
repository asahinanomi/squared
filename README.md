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

1. **Sign in** — dotted-grid background (light dots, `--dot: #dddcd6` — a texture you barely notice, lightened after phase 4 so it never competes with text), logo mark (rounded square with a paint wave), wordmark `squared` + grey `.today`, a black pill button "continue with Google" (Google's official G mark goes in the circle).
2. **Today / paint** — logo top-left, hamburger top-right. Question "did I spend Today meaningfully?" with a dotted underline on "meaningfully", then the date, "Mon, Oct 12th, 2026" (short weekday, the "th" raised; screen readers hear the full "Monday, Oct 12th, 2026"). One large square to paint in the center, with a quiet word in its middle — "to paint" while blank, then "meaningful" · "wasted" · "slipped by" once painted (small, lowercase, soft ink; it steps aside the moment the brush touches the square). A paint palette (three wells + brush) sits under the square. **Day screen, after phase 4** (built after review): no grey veil and no month behind the square — the question, date, square and palette sit together, tighter, in the middle of the first screen, on the plain dotted paper; notes follow right after the palette (just past the colour's meaning line), unchanged otherwise (full length, page scroll), each with the same light keyline as the entries in what matters. The "show older / hide older" toggle sits 24px clear of the first note, so a tap on it never lands on a note. One rhythm down the screen: 40px of ink under the question (the same as from the palette to the notes, so the question stands alone as the title), then 16px between date and square, square and brush tip, and the colour's meaning line and the notes. The trio is placed in the middle by measuring the screen, so the square stays in the same spot on every day however long its notes are. The square is a little bigger now (up to 176px) and the palette is drawn to the same width, so the palette is never wider than the square; a little more room sits between the top bar and the question. **Day by day, sideways**: a large, light grey arrow on the left of the square steps to yesterday; one on the right steps toward today (not shown on today). (A first try showed the neighbouring days as small faint squares in their paint; it read as noise.) Swipe right to pull yesterday in, left to go back toward today, one day per swipe with a soft stop at today (and at the birth date); the date and square slide in with the day. A swipe never starts on the square (that's a brush stroke), on a note (notes keep swipe-to-delete), or at the screen's very edge (Safari's back gesture). Also: tap an arrow; ← / → arrow keys; a sideways two-finger trackpad swipe (one day per flick). Android gives a tiny haptic tick per step; iPhone web has none. The arrows are also the screen reader's "previous / next day" buttons.
3. **Month calendar** — `‹ October 2026 ›`, M–S weekday header, painted days filled with their color, today outlined in black, past unpainted days dashed, future days light grey. Each day shows its number with a tiny weekday ("Wed") under it. Hint: "tap a day to paint it".
4. **Why bubble** — after the square is filled, a white speech bubble pointing at the square: "why?" with a text box that grows as you write (paragraphs allowed) and a "done" button. Below it: "tap anywhere to skip".
5. **Meaning sheet** — tapping the underlined "meaningful" opens a bottom sheet titled "meaningfully" (lowercase, like every screen title): *Not a good day or a bad one. Not what you got done. A day is meaningful when you were aware of it, and spent it on what matters to you.* Followed by the three color definitions (each led by a small round paint dot with a keyline) and a black "close" button.

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

In the app the meanings read, in the brand story's words: **green** "yes — I spent it on what matters." · **red** "no — I was busy, but none of it mattered." · **grey** "I don't know — I wasn't paying attention." Short labels, everywhere space is tight (the word in the square, legends, filters): **mattered** · **empty** · **slipped**. Always listed green, red, grey. They show in the "meaningfully" sheet, and as a quiet grey line (led by a small dot of that paint) under the palette each time a color is dipped (it fades after a few seconds, or as soon as painting starts).

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

## Buttons

| Kind | When | Examples |
|---|---|---|
| **Solid black pill** | The one main action of a screen or sheet. Never more than one per view. | continue with Google, start painting, close, done (note), now, paint today |
| **Solid dark grey** (`--grey-4`) | Destructive actions. Grey, not red: colour belongs to paint only. | delete (note), delete (alert) |
| **Keyline** (2px ink outline, no fill) | A secondary, neutral action beside or after the main one. | cancel, add new note |
| **Dashed, on white** | An empty slot in a list, waiting to be filled (white with a dashed edge, like future day squares). | + add (what matters) |
| **Faded keyline + "soon"** | Not built yet; not tappable. | share my pie, download |
| **Text link** | Quiet navigation, not an action. | the dotted "meaningful", back arrows |
| **Soft capsule** | The bar's one action: light grey fill (#efefea), ink text, no outline — the same look as the years · months · days filter. | today (zoom bar) |
| **Segmented control** | Switching between views of the same content. | years · months · days; whole life · days I lived · painted only |

Width and size:
- **Full width**: the main action that ends a screen or sheet, at its foot. Every full-width black pill is 54px tall with 18px text (the Google sign-in button, 64px, is the one exception).
- **Hugs its text**: actions inside a card or bubble (done / delete, at least 88px; add new note).
- **Equal halves**: a two-choice dialog (cancel | delete).
- Tap targets are never smaller than 44px.

## Capitalization

| Kind of text | Style | Examples |
|---|---|---|
| Statements and questions the app says to you | Sentence case | "did I spend Today meaningfully?" (the owner's wording), "Delete this note?"; the three meaning lines are lowercase, in the brand story's words |
| Screen and sheet titles | all lowercase | a life, settings, a life pie, in slices, meaningfully |
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

Design: the "Settings (hub)" and "Onboarding (how many squares?)" boards. Menu: today · my squares · settings · sign out — the things about you — and, set apart at its foot under a hairline in quieter grey, "the idea" (about the app). The sign-in screen also carries a quiet "the idea" link under the Google button, for someone new; opened from there it has a "‹ sign in" back arrow and no link on to what matters.

- Step 1 (done): **settings hub** — back arrow (returns to where you came from), "settings", four rows: square settings ("Oct 26, 1971 · 95 years · 34,699 squares", opens the square screen), and reminders / my data / account shown with a "soon" tag and not tappable. "squared.today" at the foot. The "how many squares?" menu item is gone.
- Step 2 (done): square settings — one shared screen, two modes (first-run "how many squares?" + "start painting", which lands on today; from settings "square settings", back arrow, saves as you change it, quiet offline cue). Moving the birth date later hides earlier painted days, never deletes them.
- Step 3 (done): life glass — replaces the hint text on every zoom level: an hourglass whose sand is your life (top = squares left, bottom = spent). Just the icon until tapped; a tap shows "14,620 days (42%) to paint!" in a soft pill — in years on a life · years, in months on a life · months and the year screen, another tap hides it. A few grains trickle on arrival and every 30 seconds (off with "reduce motion"). The glass, zoom icons and "today" are a soft dark grey (#55554F), not black. (It replaced a first try: a battery bar.)
- **what matters** (done): settings → "what matters" — two short lists, mattered (green) and empty (red), of what each kind of day looks like to you. Your compass when you paint; a reference only, it never scores or colours a day. Tap "+ add" to write an entry (a line or two, up to 120 characters; Enter or tapping away saves), tap an entry to edit, swipe it left to delete (an in-app "Delete this entry? It can't be undone." alert confirms, as for notes), clear it to remove it. **Filter**: a segmented control under the line, **all · ● mattered · ● empty**, shows both lists or just one (opens on all every time). **Reorder**: press the quiet grip (⋮⋮) at the right of an entry and drag it up or down (with a keyboard: focus the grip, arrow keys); the grip shows once a list has two or more entries, and the new order saves and syncs like any change. Saves itself to your account (`matters` table, migration 0007; its second column renamed `empty` → `wasted` by 0008 — the app reads and writes either, so the two can land in any order, and older device copies load too), so every device shows the same lists, with a copy on the device (`squared.matters`) so it opens at once and offline. Each change saves on the device at once and goes to the account once typing pauses (or on leaving). Opening it, whichever copy changed last wins and the other catches up; a device that had lists before sync uploads them the first time, if the account has none. Before 0007 is run it simply stays on the device. At the foot, a black pill button "now, paint today →" (or "back to today →" once today is painted) leads to the square. The line under the title reads: "what does a meaningful day look like to you? and what feels empty?" (The data keeps its names, `meaningful` / `wasted`; only the words on screen changed.)
- Step 4: polish & wrap-up.

## Phase 4 — pie view (done)

Design: board "16 · Pie — line art (final)". Built step by step; I check each step.

- Step 1 (done): **a life pie** — the centre of the zoom bar (between the life glass and the zoom buttons) holds a pie icon on every zoom level; tap it for the pie. On the pie, it turns into a squares icon (2×2, one filled) that takes you back to the level you came from; there the zoom buttons step the pie's scope (step 2). All bar icons are drawn to the same height. No back arrow on the pie, just the logo and menu. Title "a life pie, in slices" (the subtitle was dropped after review, to give the pie the room). The pie is large but a touch inside the screen (88% of the width, up to 310px) and the legend lines up with its edges; the two scroll together when they don't fit, under a fixed title, filter and bar. Line art: a 3px rim (like today's big square) and 2px lines between the slices (like the paint pellets), slices clockwise from 12 o'clock — green "lived, it mattered" · red "here, but wasted" · grey "slipped by" · light grey "lived, not painted" (lived days left blank) · blank with a dashed keyline "still to come". Every legend row reads in ink, none faded. **Numbers inside the pie**, wherever a wedge has room: whole life prints "N / days to paint" in the future wedge (today counts there until it's painted, so it matches the life glass) and "N / days lived" in the widest lived wedge; days I lived prints "N / days lived"; painted only prints each slice's own count, in ink on the paint. Backfilled days count the same as on-the-day ones. A slice of 0 days isn't drawn; its legend row stays, with 0. Legend under the pie: keyline dot, label, count. "share my pie" and "download" show greyed with a "soon" tag, at the foot of the scrolling area (so on a short window they scroll away before the legend is cut). With no birth date yet, "how many squares?" appears on the way. The life glass's count pill now floats just above the glass (on every level), so the bar's icons never move or hide.
- Step 2 (done): **scope filter** — a quiet segmented control under the title, same chart out of three denominators: whole life (always opens here, never remembered) · days I lived (your birth day through today, both included: the colours and "lived, not painted", no future) · painted only (just the three colours). The legend shows only the rows in the pie's count. With nothing painted, the pie is an empty keyline circle. **Zoom steps through them**: pinch in or the zoom-in button goes whole life → days I lived → painted only, pinch out or zoom-out goes back; each greys at its end. (An earlier "since I started" was dropped after review: with backfilling its start was just the oldest painted day.)
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
- After phase 4: the zoom bar (life glass · pie switch · zoom buttons) sits on its own band — plain paper with no dot grid and a 1px hairline above, edge to edge — so it reads as app controls, not content. It runs to the bottom edge and keeps only the phone's home-bar room below the icons (10px on phones without one). The icons are drawn at 26px (the life glass a touch smaller), with 44px tap targets. The day screen's zoom pair sits on the same band.
- After phase 4: **one view switch** — the left of the bar holds a small capsule with the three ways to look, always the same three in the same order: **▦ squares · ◔ pie · ≡ list**, the one showing raised (white), like the years · months · days filter. Tap another to switch; it opens at the matching level. (It replaced two icons that each turned into a squares icon while their view was showing.) The switch picks how you look; zoom picks how close; a day always opens on the paint screen.
- After phase 4: **the pie leads to its days** — tap a slice (or its row in the legend): it stays, the rest fade, and one quiet line appears under the pie, "113 empty days · **see them →**". Tap it and the list opens on just those days, newest at the foot, with a soft capsule at the top, "● only empty ×" — tap it for all days again. Works for mattered, empty, slipped and unpainted (a to-do of days to go back and paint); "ahead" isn't tappable. Tap the same slice again to let it go. The filter belongs to the days level: zooming the list out (or its capsule) shows everything again.
- After phase 4: **a life, day by day** — the days as a list, a view beside the pie (not a zoom level: pinch and the zoom icons only ever walk the squares — a life → year → month, 7 then 3 to a row → the day). In the bar, a **list icon** (≡, three dots and lines) sits next to the pie switch on every level; tap it and the list opens on the time you were looking at (the month in view, the middle of the year, the day in the middle of a life · days; today from elsewhere). While the list or the pie is showing, its icon turns into a squares icon: tap it to go back exactly where you came from. Each day is a short card: its colour in a swatch (lighter if late), the date and its word ("Fri, Oct 16th · mattered"), "painted Oct 19, 2026" for a late square, and the latest note cut to two lines. When there's more to read — a longer note, or older ones — a quiet **more ⌄** link ("more · 2 notes ⌄") opens the card in place: every note in full, oldest first, each with when it was written (just the time if written on the day, else the date too); **less ⌃** folds it back. A tap anywhere else on a card opens the day, as a square does — one rule everywhere — and zooming out of that day comes back to the list. Unpainted days stay a quiet line with an empty swatch; today's swatch is outlined, at the foot; ◎ glides back to it. Only the months around where you are are drawn, more as you scroll either way, so it opens at once even decades back; their notes load as they're drawn. **The list zooms within itself**, like the pie: years → months → days. Zoom out (or pinch out) from the days for **a life, month by month** — a card per month under its year, with its colours as a band on its side (the same shares as its square) and its counts ("11 mattered · 4 empty · 3 slipped · 12 unpainted") — and once more for **a life, year by year**, a card per year. Zoom in (or pinch in, or tap a card) to go closer: a year opens its months, a month its days, and zooming in on the days opens today's square, the same end as the squares. ≡ opens the list at the level that matches the squares (a life → years, a year → months, a month or a life · days → days); its squares icon goes back where you came from, or — once you've zoomed within the list — to the squares at that level, where you are. One rule for all three views: zoom moves within the view you're in; the icons on the left switch views. Every level of the list wears the life's own head, exactly as on the squares — **a life** with its life glass, and the **years · months · days** capsule, which jumps straight to that level of the list where you are (the old per-level titles, "a life, day by day" and so on, are gone). (Fixed along the way: on a tall phone, opening a past month could jump 12 months ahead — Chrome's own scroll anchoring doubled the place-keeping when older months were added above.)
- After phase 4: **fresh until noon** — a first paint keeps the full colour on the day itself, or the next morning until noon (in your own time zone): still an honest memory. Later than that it is backfilled, one shade lighter. The database decides (migration 0009, which also re-checks every square already painted by when it was first painted); the app uses the same rule for the instant paint. Repaints keep the first paint's shade. A late square shows its **first-paint date** small under the word on the day screen ("empty" / "painted Oct 19, 2026") — like a journal entry's date, it marks when you came back to that day; it never changes on a repaint (the row's `created_at`). Fresh squares keep just the word. No streaks: a run of present days already shows as a solid stretch of full colour.
- After phase 4: **a life · days** writes in ink on every painted square, fresh or late, like the month (it used white on fresh ones). Tapping a square big enough to show its number opens that day directly, like the month; tiny squares (and days ahead) still show the date first ("… · open ›"), so a mis-tap never opens the wrong day.
- After phase 4, **brand story copy**: the words on screen follow the brand story. The question stays "did I spend Today meaningfully?". The colour lines: green "yes — I spent it on what matters.", red "no — I was busy, but none of it mattered.", grey "I don’t know — I wasn’t paying attention." The short labels, the same everywhere: **mattered · empty · slipped** — the word in the square, what matters (its filter and list titles, "what makes a day feel empty?"), settings ("mattered & empty — your compass") and the pie legend, which reads **mattered · empty · slipped · unpainted · ahead** (unpainted = days lived but not painted; ahead = squares not lived yet). The idea page is rewritten in nomi's words (the busy days, the one question, the three colours with their lines — each led by its paint dot, not an emoji, to keep colour to the paints — "paint one square a day…", "(start by naming what matters to you →)", signed — nomi). Copy only: numbers, logic, data and layout unchanged.
- After phase 4, **controls only** in the zoom bar: the pie ↔ squares switch on the left; **"today"** pinned to the centre on every level (it goes to the paint screen; on the day screen it shows only on a past day and jumps back to today); the zoom pair on the right. **◎** (back to today's square on the same screen, shown only once today has scrolled out of view) no longer sits in the bar: it floats just above the bar's right end, over the content — a small round paper chip, ink only, with a soft shadow — fading in while today is away and gone once you're back, so the bar itself never shifts. The **life glass** left the bar (it is information, not a control) and now sits beside "a life" in the title of a life, a little smaller; tapping it opens its count ("14,618 days to paint!", in the unit of the view) right beside it in the title row. The title row is pinned to the title's height (the glass's tap area hangs over it), so title → capsule spacing matches the pie exactly. The % left out: shares are the pie's job.
- After phase 4: square settings' line under the big number reads "20,079 lived, 14,620 (42%) to paint" — one plain sentence in one ink, weight and size, and the old "in years / in squares" link became a small segmented control, **in squares | in years** (opens on squares every time). The line and the control sit close together as one group, with more room above them, under "squares".
- After phase 4: the subheadline "95 years · 1,140 months · 34,699 days" became the same quiet segmented control as the pie's filter (the current view raised in white).
- After step 7: **"today"** — when today has scrolled out of view (month, year, a life in months or days, at any zoom), a "today" link appears left of the zoom buttons. Tap it and the same screen glides back to today's square (this month / this year), which pulses once; the link hides again. It stays on the screen you got lost in. Labels show as soon as they fit inside the square at a readable size (9px+): a life in months prints "Oct / 2026" from 6 a row; a life in days prints the number from 7 a row and "2026.10 Thu" at 3 a row; the space between squares grows with them (7 and 3 a row match my squares).
- **Date labels on day squares (agreed):** big date number; a small line under it. Normal size: "Thu". Zoomed in: "2026.10 Thu" (year.month, then weekday — never "Oct '26", which reads like a date). Zoomed far out: color only, no text. Applies to the month view and "a life · in days" once pinch zoom lands (steps 6–7).
- Step 8 (done): **ship** — full regression pass (paint, notes, swipe delete, instant save, every zoom level, pinch anchoring, labels, "today"), speed check with ~18,000 painted days, README wrapped up, PR merged into `main`.

## Live

- App: **https://squared.today** (Vercel; `www.squared.today` redirects here). Backup URL: https://squared-peach.vercel.app
- DNS at GoDaddy: `A @ → 76.76.21.21`, `CNAME www → cname.vercel-dns.com`. No other A/AAAA records for `@` (the GoDaddy "Parked" A record must stay deleted).
- Supabase project `xsqpdmtruajdunawpxhk`: Site URL `https://squared.today`; Redirect URLs `https://squared.today/**` and `https://squared-peach.vercel.app/**`.
- Google sign-in: the OAuth client's redirect URIs are `https://xsqpdmtruajdunawpxhk.supabase.co/auth/v1/callback` and (for direct sign-in) `https://squared.today/`; its ID and secret live in Supabase → Authentication → Providers → Google.
- Vercel env vars (Production + Preview): `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` (the publishable key of the project above). They are baked in at build time, so redeploy after changing them.
