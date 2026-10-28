# The big picture

_last updated Oct 28, 2026_

Where squared is, in the big steps. Many moving parts, one road. Each step has its own doc; this one only says where we are. Move the "you are here" marker as steps finish. The road's docs are numbered by their step (`2-beta-readiness.md` is step 2). There are two betas: beta 1 on the web with close friends (step 3), beta 2 on TestFlight (step 6); a step with no doc of its own has no file, and two steps at the same time would be 3a and 3b. Reference docs (squared's heroes, brand story, design system, future ideas, test links) have no number: they're used at every step.

## The road

### 1 · I trust squared ← you are here

Not only the app: the story too. Ready means comfortable, not perfect. **A time box: about two weeks** (until early Nov). If it isn't there by then, write down what's missing and decide, rather than keep polishing.

- [ ] **The app:** a quiet week of just painting, no design changes; anything odd goes to Claude. (Used it 5 or 6 days so far, changing it daily.)
- [ ] **The crash log** is clean (`client_errors`, see beta readiness). Checked Oct 28: only my own rows from Oct 22–26, mostly the iPhone "dead connection after waking" saves, fixed Oct 25 (one row since, Oct 26). **Recheck around Nov 1**: no new rows → tick; new "Fetch is aborted" rows → send them to Claude.
- [ ] **The brand story** feels true: "squared starts today", the line, the three colours (`docs/brand-story.md`).
- [ ] **Open questions** I can live with for now, decided or parked:
  - the past: lived, not blank (parked until testers, `docs/future-ideas.md`)
  - ~~onboarding step 3's question~~ (onboarding is gone, Oct 25, 2026: moments first, set up later from my days)

### 2 · squared is safe for other people's days

`docs/2-beta-readiness.md`, "Before beta": Supabase Pro backups, two-factor logins, domain auto-renew, the first backup download.

### 3 · Beta 1: the web, close friends

`docs/3-beta1-web.md`: 10 to 15 friends I trust, on squared.today (add to home screen), two weeks. squared isn't explained on purpose: does it make sense on its own, and do people come back? On the web, a fix is live in a minute, so this is where we fix daily.

### 4 · Listen, fix

Sort what friends said: fix now, try next, parked. Fix the "fix now" ones on the web, fast. Decide the big ones (the past).

### 5 · squared on my iPhone

`docs/5-ios-todo.md`, steps 1 to 4: the Apple account, the native shell, sign-in (Apple and Google), the evening reminder. Then TestFlight, just me.

### 6 · Beta 2: TestFlight

`docs/6-beta2-testflight.md`: the real app, installed from a link. Beta 1's friends plus a few new people, some strangers. Tests the app feel (the reminder, sign-in with Apple). Changes here are slower (a build on the Mac each time), so they come in batches.

### 7 · Listen, then decide

Sort what testers said again. One more round if needed, or on to the store.

### 8 · The App Store

`docs/5-ios-todo.md`, steps 5 and 6: the store page, review, release by hand. Launch day: `docs/8-growth.md`.

### 9 · After launch

Private notes (end-to-end encryption) first (`docs/future-ideas.md`), then what real people ask for.

### 10 · Promote and support squared

Later, nothing to do yet: how squared keeps finding people after launch, and how people get help (questions, answers, App Store reviews). Its doc, `10-…`, is made when we get here; launch day itself is in `docs/8-growth.md`.

## Remember

- One step at a time. Design ideas wait in future ideas, they don't jump the road.
- The app is ready when I trust it, not when it's perfect.
- squared starts today. So do I.
