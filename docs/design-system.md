# squared.today — Design System (visual identity)

_Pairs with `brand-story.md` (voice & copy). This doc = look: logo, color, type, components. v1.1 · Oct 19, 2026 · matches the app_

---

## Logo

- **Mark:** a rounded square with a wave filling from low-left to high-right — life's ups and downs / a life filling up. Black on paper. (Original mark — keep.)
- **SVG (as in the app — `public/logo.svg`, `src/components/Logo.tsx`):**
  ```
  <svg viewBox="0 0 100 100">
    <path d="M8 80C22 64 34 57 48 55C62 53 70 51 76 46C81 42 86 40 92 39V80Q92 92 80 92H20Q8 92 8 80Z" fill="#141413"/>
    <rect x="7" y="7" width="86" height="86" rx="18" fill="none" stroke="#141413" stroke-width="10"/>
  </svg>
  ```
- **Wordmark:** `squared` — Inter 600, letter-spacing −0.02em (Oct 25, 2026: no ".today" in the logo; the domain lives in the footer, the website and share cards). On sign-in 15px, under a 56px mark, the two the same width: one lockup.
- **Lockups:**
  - **Stacked** (icon above wordmark, gap ~12px) — sign-in / splash / brand moments. *(The chosen home treatment.)*
  - **Horizontal** (icon left, wordmark right, gap ~10px) — in-app header, compact spaces.
- **Min size:** 28px (favicon-safe); don't go smaller. Keep clear space ≈ ½ the mark's height around it.

## Color

**App palette**
| role | hex |
|---|---|
| paper (background) | #FAFAF8 |
| ink (text, mark) | #141413 |
| ink-soft | #3D3D3A |
| muted (secondary text, links) | #6F6F6A — the one grey for small text you read (4.8:1 on paper) |
| faint (decoration only — never text you need to read: chevrons, separators, placeholders, future squares) | #C4C4BF |
| hairline / border | #E2E2DB |
| dot grid | #DDDCD6 |
| .today grey | #A3A39E |

**Paint colors (semantic — the three answers)**
| answer | hex |
|---|---|
| 🟩 worth it (green) | #6E9B7B |
| 🟥 regret (red) | #C06A62 |
| ⬜ a blur (grey) | #8E8E87 |

_(The review-mock backdrop #EFEEE9 is not an app color.)_

## Type
Two voices (full mapping in `brand-story.md` §9). Both free on Google Fonts.

- **Reflective voice — Fraunces (serif).** The Google serif closest to Unmet's Denton. `font-optical-sizing: auto`. Use: the daily question, the definition, nomi's prose. Weights 400–500.
  - Question: ~34–35px on the day screen, ~28px on sign-in (under the number) · weight 450 · line-height 1.22 · letter-spacing −0.005em.
- **System voice — Inter (sans).** Use: wordmark, UI, buttons, labels, data. Weights 400 / 500 / 600.
  - Wordmark 15/600 on sign-in (−0.02em) · the number line 16/400 ink-soft (29,200 in 600 ink) · squared's line, the serif 26/450 · framing & body 16/400 · button 15.5/500 · links 12.5.
- **Scale (Inter):** 12 labels & timestamps · 14 secondary · 16 body & controls · 18–20 reading text (notes, idea, privacy) · 28 screen titles · 36 the idea's title · 56 hero numbers. Weights 400 / 500 / 600 only. The wordmark (22) sits outside the scale, as a logo.
- **The hand — Caveat (600).** Only the word signed on the day's canvas: lower-right corner (15% in from the bottom and the right), tilted −4°, 22px blank (soft grey), 30px painted, in a deeper shade of its own paint. Nowhere else.
- **Ordinals are raised** wherever they're written out (55th, Oct 12th): the suffix at 0.6em, superscript (`<Raised>` in `src/components/Raised.tsx`, or a `<sup>` beside a date). Screen readers hear the word whole.
- **Floor:** nothing you read is under 12px; inputs are at least 16px (iOS zooms smaller ones).
- **No hard line breaks** in questions or titles: they wrap where the screen ends.
- **Accent:** a **dotted** underline (2.5px dotted ink) under the key word in a reflective line ("Today", "meaningful") — never a solid underline.

## Background
squared's signature ground: **dotted grid** — `radial-gradient(#DDDCD6 1.2px, transparent 1.4px)`, 22px tile, 11px offset, over paper. No calendars or busy textures behind content.

## Components
- **Surface:** paper + dotted grid.
- **Main button:** one solid black pill per view, 250px wide (narrower only on a narrower screen), left-aligned with the page's text (centred only on onboarding and sign-in), 54px tall, 18px/500 text. Small actions in a card hug their text; a two-choice dialog splits into equal halves.
- **Sign-in button (secondary / quiet):** white fill, 1.5px #E2E2DB border, pill (radius 999), 250px wide, min-height 50px, Inter 500, real Google "G". Deliberately understated so the question leads — never a solid black button.
- **The day's canvas:** the one square you paint on is a canvas — a clean ink edge (2.5px, nearly square corners), a thin raw-canvas margin inside it (7px, #EBE6DA) where the priming stops, and a primed face with a fine linen weave while blank (smooth paint once painted, kept inside the margin). Flat, with a short desk shadow; no 3D, no wobble. Every other square (month, list, life) is a gallery thumbnail and keeps the plain rounded square.
- **Control bar:** its own surface, #FCFCFA with no dot grid, lifted by a soft shadow cast upward (0 −4px 14px, ink at 7%) — never a hairline.
- **Pie labels:** every label (number, word under it) sits on the line from the centre to the rim through the middle of its wedge, halfway out.
- **Beta mark:** a small soft capsule, lowercase "beta", 12px/500 ink on #E9E9E3, radius 999. Beside the wordmark on sign-in and at the settings foot; never in the menu or on the day screen.
- **Capsules (segmented control):** left-aligned on text pages (what matters, the idea's tabs, how many squares); centred only on the centred views (a life, the pie).
- **Footer:** one component everywhere: dotted hairline, small print (12px, muted, dot-separated), then "© year squared.today" with the beta capsule, all in muted: it's text you read, never faint. Left-aligned with the page; centred (no hairline) only on sign-in.
- **Links / dividers:** 1px dotted hairlines.

- **The bottom bar, on every page**: for getting around only. "today" always in the centre (the one constant way back to now); the squares/list switch on the left on the time views (the day, the month, a life, the list).
- **The bar in squares** (Oct 28, 2026): the squares · list switch (its pill), today as its square in the centre (34px, 2.5px ink edge until painted, then today's paint), my days as two stacked squares at the right (the day behind in grey #a8a8a1). Where you are: the dotted ink underline (2.5px dots, 30px), never a raised or pressed look.
- **Zoom floats on the squares**: a slim white capsule at the bottom right, just above the bar (zoom in over zoom out), ◎ on top of it when today is out of view. Only where there are squares to zoom.

## Layout — sign-in / home
Three groups in one vertically centred column. **Brand** (stacked, small). 64px, then **the message** — the number as hero ("29,200", Inter 600 56px), its caption ("days in an 80-year life", ink-soft 18px), then the question (Fraunces ~28px, 450, dotted "Today"). 56px, then **sign-in** (quiet pill) and faint links. The number hits first, the question stays; brand modest; sign-in quiet.

## Keep it squared (not Unmet)
squared shares Unmet's *type thinking* and Inter, but keeps its own skin — paper, dotted grid, wave mark, black-on-off-white. Never Unmet's lime/green. Cousins, not twins.
