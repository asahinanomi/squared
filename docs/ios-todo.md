# iOS to do

_last updated Oct 25, 2026_

squared on the App Store, started while the web beta runs. Tick items as they're done.

## The plan in one line

Wrap the same app in **Capacitor** (the web build bundled inside a native iPhone shell), add only what Apple requires and what a phone does better, and use **TestFlight as the beta**. One codebase: the web app stays, squared.today keeps working.

## Why, and what not to expect

- **Why:** a real icon on the home screen, an evening reminder to paint, and a place people can find squared. A daily habit lives on the phone.
- **Not to expect:** the App Store alone rarely brings many people. Growth still comes from people telling people. The store makes squared easier to keep, more than easier to find.
- **Solid over clever:** the same screens and the same saving (online first). No offline copies, no sync. The native part stays as small as it can be.

## What Apple will check (the ones that bite)

- **A web page in a box gets rejected** (guideline 4.2). squared needs to feel like an app: bundled, not loading squared.today; the evening reminder; no browser bits showing.
- **Google sign-in needs Sign in with Apple beside it** (4.8). Supabase supports it with the same `signInWithIdToken` squared already uses.
- **Google blocks sign-in inside an app's web view.** Google sign-in has to go through a native plugin, which hands back the same id token.
- **Delete my account** must be in the app. ✓ It's already in settings.
- **A test account for the reviewer**, because squared needs sign-in. A separate Google account made only for this, with a few painted days. Never nomi's.
- **Privacy labels** in App Store Connect: what's collected (email, name, the days, the notes, crash reports), linked to the account, not used for tracking.

## 1 · Accounts and setup (nomi)

- [ ] **Apple Developer Program** ($99 a year), as an individual: the store then shows nomi's legal name as the seller.
- [ ] **A Mac with Xcode**, or a cloud build service (Codemagic, for example) if there isn't one. This decides how builds happen, so it comes first.
- [ ] **App name in App Store Connect:** "squared" will likely be taken. Pick a fallback early, such as "squared: paint your days".
- [ ] **Bundle id**, for example `today.squared.app`.
- [ ] **Two-factor login** on the Apple account (as for the others in beta readiness).

## 2 · The native shell (Claude)

- [ ] Add Capacitor and an `ios/` project; build the web app into it (bundled, not a remote URL).
- [ ] Turn off the service worker in the app build (the app is already bundled).
- [ ] The content policy as a meta tag in the app build (Vercel's headers don't reach it).
- [ ] Safe areas, the status bar and the splash screen: paper colour, the logo, no flash of white.
- [ ] Keep links like /idea, privacy and terms inside the app; outside links open in Safari.
- [ ] App icon from the logo, every size Xcode asks for.

## 3 · Sign-in (Claude, with nomi in Google Cloud and Apple)

- [ ] **Sign in with Apple**: Apple Developer setup (nomi), Supabase's Apple provider turned on (nomi), and the button on sign-in (Claude). It's a second quiet keyline pill under Google, so the question stays the hero.
- [ ] **Native Google sign-in**: an iOS client id in Google Cloud (nomi), and a native plugin that returns the id token to Supabase (Claude).
- [ ] The same account either way? Apple can hide the email ("hide my email"), so Apple and Google become two separate accounts. Say so plainly on sign-in or in questions. Don't build merging (solid over clever).
- [ ] **The lock in the app:** at 30 sec, every return to the app means signing in again. Fine for the first version. Face ID is parked in future ideas and fits here later.

## 4 · What the phone does better (Claude)

- [ ] **The evening reminder:** one local notification at a time you choose ("paint your day" at 9 pm, for example). Off until you turn it on; set in settings. No server, no push service.
- [ ] Haptics: a soft tap when a square is painted (a small touch, optional).

## 5 · The store page (nomi writes, Claude helps)

- [ ] Subtitle (30 characters), description, keywords. In the voice of the brand story.
- [ ] Screenshots at the size App Store Connect asks for (the largest iPhone): home, painting a day, my days, a life in squares.
- [ ] Privacy policy URL (squared.today/privacy) and support URL.
- [ ] Age rating: the terms say 18+, so answer the questionnaire to match.
- [ ] Privacy labels (see above).
- [ ] Update privacy, terms and questions to mention the iPhone app and Sign in with Apple.

## 6 · TestFlight, then the store

- [ ] **Internal testing** (nomi only, no review): live with it for a few days.
- [ ] **External testing** (up to 10,000 testers, by link): a light review first. This can be the beta.
- [ ] **Submit for review** with the test account and notes for the reviewer.
- [ ] After approval: release by hand, not automatically, so it goes out when nomi is ready.

## Open questions

- Is there a Mac? (Decides how builds happen.)
- Android too, later? Capacitor does both from the same code, but one store at a time.
- Should squared.today get a "get the app" link once it's live, or stay quiet?
