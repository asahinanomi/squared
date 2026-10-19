# squared.today — Design System (visual identity)

_Pairs with `brand-story.md` (voice & copy). This doc = look: logo, color, type, components. v1 · Oct 19, 2026_

---

## Logo

- **Mark:** a rounded square with a wave filling from low-left to high-right — life's ups and downs / a life filling up. Black on paper. (Original mark — keep.)
- **SVG (reference):**
  ```
  <svg viewBox="0 0 100 100">
    <path d="M10 76 C30 72, 38 52, 60 50 C76 48.5, 82 44, 90 41 L90 76 Q90 90 76 90 L24 90 Q10 90 10 76 Z" fill="#141413"/>
    <rect x="10" y="10" width="80" height="80" rx="13" fill="none" stroke="#141413" stroke-width="7"/>
  </svg>
  ```
- **Wordmark:** `squared.today` — Inter 600, letter-spacing −0.02em; render `.today` in grey **#A3A39E**. On the home screen ~27px.
- **Lockups:**
  - **Stacked** (icon above wordmark, gap ~12px) — sign-in / splash / brand moments. *(The chosen home treatment.)*
  - **Horizontal** (icon left, wordmark right, gap ~10px) — in-app header, compact spaces.
- **Min size:** 28px (favicon-safe); don't go smaller. Keep clear space ≈ ½ the mark's height around it.

## Color

**App palette**
| role | hex |
|---|---|
| paper (background) | #FCFCFA |
| ink (text, mark) | #141413 |
| ink-soft | #55554F |
| muted (secondary text, links) | #8A8A82 |
| hairline / border | #E2E2DB |
| dot grid | #DBDBD3 |
| .today grey | #A3A39E |

**Paint colors (semantic — the three answers)**
| answer | hex |
|---|---|
| 🟩 mattered (green) | #6E9B7B |
| 🟥 empty (red) | #C06A62 |
| ⬜ slipped (grey) | #8E8E87 |

_(The review-mock backdrop #EFEEE9 is not an app color.)_

## Type
Two voices (full mapping in `brand-story.md` §9). Both free on Google Fonts.

- **Reflective voice — Fraunces (serif).** The Google serif closest to Unmet's Denton. `font-optical-sizing: auto`. Use: the daily question, the definition, nomi's prose. Weights 400–500.
  - Question: ~34–35px · weight 450 · line-height 1.22 · letter-spacing −0.005em.
- **System voice — Inter (sans).** Use: wordmark, UI, buttons, labels, data. Weights 400 / 500 / 600.
  - Wordmark 27/600 (−0.02em) · framing & body 16/400 · button 15.5/500 · links 12.5.
- **Accent:** a **dotted** underline (2.5px dotted ink) under the key word in a reflective line ("Today", "meaningful") — never a solid underline.

## Background
squared's signature ground: **dotted grid** — `radial-gradient(#DBDBD3 1.3px, transparent 1.3px)`, 22px tile, 11px offset, over paper. No calendars or busy textures behind content.

## Components
- **Surface:** paper + dotted grid.
- **Sign-in button (secondary / quiet):** white fill, 1.5px #E2E2DB border, pill (radius 999), min-height 50px, Inter 500, real Google "G". Deliberately understated so the question leads — never a solid black button.
- **Links / dividers:** 1px dotted hairlines.

## Layout — sign-in / home
Vertically centered cluster, in order: **brand (stacked) → framing line → question (hero) → sign-in → faint links**. The question is the visual hero; brand modest; sign-in quiet.

## Keep it squared (not Unmet)
squared shares Unmet's *type thinking* and Inter, but keeps its own skin — paper, dotted grid, wave mark, black-on-off-white. Never Unmet's lime/green. Cousins, not twins.
