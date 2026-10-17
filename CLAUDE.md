# squared — working notes for Claude

Read `README.md` first: it is the product spec and the record of every phase built so far.

## Who & how

- I'm nomi, the maker and only user. Talk to me short, warm, to the point — no fluff.
- When I ask "what do you think / if you agree do it, if not say no": give a short opinion; build only on "go" (or if I said to just do it).
- Ask before changing my design. Design boards: https://claude.ai/artifact/PFuFHaZmJXTG82GkJsT1NH
- Keep `README.md` up to date with whatever ships.

## House rules

- Copy: statements in sentence case; buttons, controls and helper text lowercase; dates written normally ("Oct 26, 1971"); "I" always capitalised; "squared" always lowercase.
- Colour lives only in painted squares and the palette (small dots of the paint colours are fine). Everything else is ink on paper. Zoom bar ink is dark grey (`--zoom-ink: #55554f`), not black.
- Painting is the point — never let a tap fill a square.
- Mobile-first. Desktop layout is deferred to a later phase.

## Workflow

- Stack: React 19 + Vite + TypeScript, Supabase (Google auth), Vercel.
- Vercel's production branch deploys squared.today on every push — verify before pushing.
- Before pushing: `npm run build` (runs `tsc -b`) and `npm run lint`. Format with `npx prettier --no-semi --single-quote --print-width 120 --write <files>`.
- Check UI changes in a real browser at phone size (390×844 and 375×667). Playwright: use `playwright-core` with `executablePath: '/opt/pw-browsers/chromium'` against `npx vite preview`.
- New SQL goes in `supabase/migrations/` as the next numbered file; tell me to run it in Supabase.
