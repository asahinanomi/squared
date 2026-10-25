# TestFlight to do

_last updated Oct 25, 2026_

The first circle: 10 to 20 people painting their days for two weeks, on the iPhone app, before the store. The build steps live in `docs/3-ios-todo.md`; this is the people side. Tick items as they're done.

## Why this first

- **Depth over size:** a few people who really use it teach more than many who open it once.
- **Credibility without the store:** testers install a real app from a link, not a website.
- **Feedback is built in:** in TestFlight, a tester takes a screenshot and adds a note. It lands in App Store Connect, next to squared's own feedback.

## Before inviting anyone

- [ ] The app is on TestFlight and nomi has used it for a few days (ios-todo, step 6: internal testing).
- [ ] The first external build passes Beta App Review (a light review, about a day).
- [ ] A public TestFlight link is turned on (up to 10,000 testers; it can be closed any time).
- [ ] "What to test" filled in for the build: the two or three things this round is about.
- [ ] Privacy, terms and questions mention the app (ios-todo, step 5).

## Who (aim for 10 to 20)

- [ ] **Honest friends:** people who'll say "this confused me", not just "nice!".
- [ ] **A mix:** some who journal or track habits, some who never have.
- [ ] **A few strangers** who think about time: a post in r/bulletjournal or r/journaling ("year in pixels" people), or among *Four Thousand Weeks* readers. Strangers are kinder to the app and harder on it, both useful.
- [ ] A short list in a private note: name, invited on, said yes.

## The invite (a draft, in nomi's words)

> I'm making a small app called squared. Each day is a square, and you paint it by how you spent it: green for what matters, red for what you'd change, grey for a day you weren't paying attention.
>
> Would you paint your days for two weeks and tell me honestly what confused you, or what you loved? It takes a minute a day. Here's the link: …
>
> — nomi

## During the two weeks

- [ ] **Day 1:** a thank-you, and the one thing to try first ("paint today tonight").
- [ ] **Day 3:** one question: "Was anything confusing?"
- [ ] **Day 14:** three questions:
  - Did you keep painting? Why, or why not?
  - What did you feel looking at your week, or your month?
  - What's the one thing you'd change?
  - Did you paint any days from before you started? Why, or why not?
  - How did it feel to see the empty years?
- [ ] Every answer goes to Claude, so it can be sorted into: fix now, try next, parked (future ideas).

## What to watch (quietly, not as a dashboard)

- Who is still painting after a week, and after two.
- Where people stop during onboarding.
- **The past:** does anyone paint days from before they started, and how far back (last week, or years)? Do they open the zoom, and what do they do there? Does anyone stop after painting a hard day? (Decides "lived, not blank": `docs/future-ideas.md`.)
- What people write in "send feedback" and in TestFlight.

## After the round

- [ ] Fix what confused people, in one batch, as one new build.
- [ ] A second round with the same people plus a few new ones, or straight to the store if it feels ready.
- [ ] Ask the testers who loved it if they'd say so on launch day (Product Hunt, the App Store, a post). See `docs/6-growth.md`.
