# squared — working notes for Claude

Where squared is on the road (the big steps) lives in `docs/1-big-picture.md`: keep its "you are here" current. Read `README.md` first: it is the product spec and the record of every phase built so far. What squared is best at (its three heroes, and the test for anything new) is `docs/squared-heroes.md`: check new ideas against it. The visual identity (logo, colour, type, components) is `docs/design-system.md`. What squared says and why (voice, the three colours, locked copy) is `docs/brand-story.md`. Parked ideas live in `docs/future-ideas.md`: add new ones there. Test links (hidden ?welcome-style links) live in `docs/test-links.md`: add any new one there. What's needed before and after beta lives in `docs/2-beta-readiness.md`: tick items there as they're done. There are two betas: beta 1 on the web with close friends (`docs/3-beta1-web.md`, with its emails), beta 2 on TestFlight (`docs/6-beta2-testflight.md`). The App Store plan lives in `docs/5-ios-todo.md`: tick items there too. How people find squared is `docs/8-growth.md`.

## Who & how

- I'm nomi, the maker and only user. Talk to me short, warm, to the point — no fluff.
- When I ask "what do you think / if you agree do it, if not say no": give a short opinion; build only on "go" (or if I said to just do it).
- Push back when you don't agree, always. Say so plainly, with why.
- Ask before changing my design. Design boards: https://claude.ai/artifact/PFuFHaZmJXTG82GkJsT1NH
- Labs (artifact mocks): never replace what's already in a lab; add new options below, so I can look back.
- Keep `README.md` up to date with whatever ships. Refresh the "last updated" date and time (UTC) under its title on every change.
- Once a change is deployed to squared.today, say so plainly: "It's live, you can test." Don't send me messages about background notices (bot comments, merge echoes) that need nothing from me.

## House rules

- Copy: statements in sentence case; buttons, controls and helper text lowercase; dates written normally ("Oct 26, 1971"); "I" always capitalised; "squared" always lowercase. No long dashes (—) in copy, they read as written by AI: use a full stop, comma, colon or "…" (the only exception is the signature "— nomi").
- Colour lives only in painted squares and the palette (small dots of the paint colours are fine). Everything else is ink on paper. Zoom bar ink is near-black (`--zoom-ink: #2f2f2b`), a touch softer than the headings; the view switch's unselected icons are `#6f6f69`, capsules `#e9e9e3`.
- Buttons follow the table in README → "Buttons": one solid black pill per view (the main action); dark grey for destructive; keyline for secondary; dashed for an empty slot; text links for navigation. Black pills are 54px tall, 18px text. Sign-in is the exception: a quiet white keyline pill (1.5px #e2e2db), so the question stays the hero.
- Painting is the point — never let a tap fill a square.
- Stay focused and minimal: ideally one main action per screen. Home can do a few more things, but never an overwhelming amount of information.
- Never let squared look "techy": no dashboards of numbers, legends or stats for their own sake.
- Solid over clever: build only features that stay simple and reliable. Avoid risky features and complex code (sync, merging, device copies). If something needs complex code, say so and offer the simple version first.
- My account holds real data: treat it as production. Never reset it or run anything that changes it without asking (losing it wouldn't be the end of the world, but keep it).
- Mobile-first. Desktop layout is deferred to a later phase.

## Workflow

- Stack: React 19 + Vite + TypeScript, Supabase (Google auth), Vercel.
- Vercel's production branch deploys squared.today on every push — verify before pushing.
- Vercel's free plan allows 100 deployments a day, and every push to any branch is one. Batch small tweaks into one push, push `main` only, and sync the `claude/` branch only when opening a PR. If a deploy says "rate limited", tell me — it isn't live.
- I'll just tell you what to change; you decide when to deploy. Hold small tweaks (a word, a spacing, an alignment) and ship them together with the next real change — tell me it's "waiting for the next deploy" — and deploy right away only when I want to test something now or it fixes a bug.
- Before pushing: `npm run build` (runs `tsc -b`) and `npm run lint`. Format with `npx prettier --no-semi --single-quote --print-width 120 --write <files>`.
- Check UI changes in a real browser at phone size (390×844 and 375×667). Playwright: use `playwright-core` with `executablePath: '/opt/pw-browsers/chromium'` against `npx vite preview`.
- New SQL goes in `supabase/migrations/` as the next numbered file; tell me to run it in Supabase.
