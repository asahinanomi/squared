# iOS to do

_last updated Oct 26, 2026_

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
- [x] **A Mac:** nomi's MacBook Pro. Builds happen there, in Xcode.
- [ ] **Xcode** from the Mac App Store (free, large; then open it once to finish installing).
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

- [ ] **The evening reminder:** one gentle local notification at a time you choose ("Today is still yours.", at 9 pm for example). Only if today isn't painted yet, never more than one a day. Off until you turn it on; set in settings. No server, no push service. (The web could do it too, on a home-screen iPhone, but only with a push server: not solid enough. The app does it on the phone itself.)
- [ ] Haptics: a soft tap when a square is painted (a small touch, optional).

## Private notes, the Day One way (after the first store version)

Why and what was weighed: `docs/future-ideas.md` → "Private notes, the Day One way".

- [ ] **The key, made on the phone:** created automatically the first time, kept in the iCloud Keychain (synced, so your other Apple devices get it). Nothing to set up, no passphrase.
- [ ] **Notes encrypted on the phone** before they're saved (AES-GCM, Web Crypto); the database only holds gibberish. Search, export and "to remember" decrypt on the phone.
- [ ] **Existing notes encrypted once**, on the phone, then the readable copies removed (backups expire on their own).
- [ ] **A recovery code**, shown once ("keep this somewhere safe"), for a lost phone with no iCloud.
- [ ] **The web, if you use both:** unlock with a passkey or the recovery code. Decide when it's needed.
- [ ] **The promise, once true:** "Only you can read your notes. Not even me." Update privacy, terms and questions. Never "100%".
- [ ] **One framed-day photo** rides on the same key (`docs/future-ideas.md`).

## 5 · The store page (nomi writes, Claude helps)

- [ ] Subtitle (30 characters), description, keywords. In the voice of the brand story.
- [ ] Screenshots at the size App Store Connect asks for (the largest iPhone): home, painting a day, my days, a life in squares.
- [ ] Privacy policy URL (squared.today/privacy) and support URL (squared.today/support, see Support at launch).
- [ ] Age rating: the terms say 18+, so answer the questionnaire to match.
- [ ] Privacy labels (see above).
- [ ] Update privacy, terms and questions to mention the iPhone app and Sign in with Apple.

### The store page, drafted (Nov 2, 2026; read together with the share card below)

The tagline for strangers is **"Your life, one square a day."** (it says what squared is); "The past is painted. Today
is still yours." stays the brand line inside (sign-in, my days, the letter), and sign-in stays as it is.

- **Name:** squared
- **Subtitle** (27 of 30): Your life, one square a day
- **Promotional text** (164 of 170; changeable any time without a review):
  > Did you spend Today meaningfully? Paint one square: worth it, a regret, or a blur. Watch your life take shape, one day at a time, and keep each month as a painting.
- **Description:**
  > squared asks one question each day: am I spending Today meaningfully?
  >
  > You answer with a brush. Paint the day's square green if it was worth it, red if you wish you'd spent it differently, grey if it passed in a blur. No typing needed, no mood faces, no scores.
  >
  > During the day, keep moments as they happen: a line, a #tag, a colour of their own. Some days are both; the square holds the answer, the moments hold the mix.
  >
  > Then zoom out. Your week, your month, and a life in days: today is one small square among every day you'll have. Each month and year you paint becomes a painting, yours to keep and share.
  >
  > Free, private, no ads. No streaks, no badges, nothing to keep up with. Just a moment, once a day, to be here and now.
  >
  > Made by one person, one square a day. I read every message.
  > — nomi
- **Keywords** (exactly 100 characters): `journal,diary,daily reflection,mindful,life in days,memento mori,mood,year in pixels,gratitude,habit`
- [ ] Re-read before submitting: anything renamed since (a feature, a word) changed here too.

### The share card, to match (Claude, when the store page goes up)

- [ ] `index.html`: og:title → "squared.today: your life, one square a day"; og:description → "Did I spend Today
  meaningfully? Paint one square a day: worth it, a regret, or a blur, and watch your life take shape."
- [ ] `public/og.png`: keep the card (the question, the grid of squares); only its small line under the question
  becomes "Your life, one square a day." (was "Paint one square a day.").

## Support at launch (nomi, no code; before beta 2 at the latest)

Apple needs a public **Support URL** with a real way to reach you, usable without signing in (reviewers check it;
people who can't sign in need it most). The in-app "get in touch" stays for signed-in people, but isn't enough alone.
Decided (Nov 2, 2026): an **email address on a public page**, not a public form. Replies go out by email anyway, so a
support address is needed either way; a form would add code and spam to handle for little.

- [ ] **support@squared.today, free** (about 20 minutes; DNS is at GoDaddy, the A record to Vercel stays untouched):
  1. ImprovMX (improvmx.com): sign up with your Gmail, add `squared.today`. Copy the records **its** screen shows,
     usually MX `@` → `mx1.improvmx.com` (10), MX `@` → `mx2.improvmx.com` (20), TXT `@` → `v=spf1 include:spf.improvmx.com ~all`.
  2. GoDaddy, one record at a time:
     - Sign in → **My Products** → next to squared.today, **DNS** (or Domain → Manage DNS).
     - Look at the list first: if there are **MX** records already (GoDaddy's parking or email), delete them, or mail
       won't route. Leave the **A** record alone (that's the website on Vercel), and the CNAME for `www` if there is one.
     - **Add New Record** → Type **MX** → Name `@` → Value `mx1.improvmx.com` → Priority `10` → TTL as it is → Save.
     - **Add New Record** → Type **MX** → Name `@` → Value `mx2.improvmx.com` → Priority `20` → Save.
     - **Add New Record** → Type **TXT** → Name `@` → Value `v=spf1 include:spf.improvmx.com ~all` → Save. (If a TXT
       starting `v=spf1` already exists, edit that one instead: a domain may have only one.)
     - Changes usually take minutes, sometimes a few hours.
  3. ImprovMX: open squared.today in its dashboard and press **Check again** until the records show green ("verified").
     Then **Add alias**: `support` → your Gmail address. From another account (or a friend), send a test to
     support@squared.today and check it lands in Gmail.
  4. Gmail → Settings → Accounts → Send mail as → add "nomi" / support@squared.today, server `smtp.gmail.com`, port
     587, your Gmail and an app password (needs 2-step verification). Confirm with the code that arrives.
  5. Change the TXT record to `v=spf1 include:spf.improvmx.com include:_spf.google.com ~all`, so replies sent as
     support@ don't land in spam.
- [ ] **A short public support page**, squared.today/support (Claude builds it): how to reach me (the address), a
  link to the faq, "I read every message myself and reply within a few days", signed "— nomi". Its address goes in App
  Store Connect as the Support URL.
- [ ] **3–5 saved replies** in Gmail: fixed in the next update; how to export your days; how to delete your account;
  thanks for the idea.
- [ ] **App Store reviews**: read weekly; reply briefly and kindly from App Store Connect, ideally with "fixed".
- [ ] **Crash reports**: Xcode Organizer and App Store Connect (the iPhone's `client_errors`).
- The routine stays beta 1's (`docs/3-beta1-web.md` → Support): bug, confusion or idea; same day for sign-in and lost
  data; never change anyone's data without asking.

## How a build gets made

Claude writes the code in the cloud and pushes it. On the Mac, nomi:

1. `git pull`, then `npm install` and `npm run build`
2. `npx cap sync ios` (copies the build into the iPhone app)
3. `npx cap open ios`, which opens Xcode
4. in Xcode: Product → Archive, then Distribute → App Store Connect. The build appears in TestFlight within minutes.

Claude can't run Xcode, so every build passes through these steps. Later, if it gets tedious, a cloud build service can do them on each push.

## Tweaks, once it's in the store

- **The web stays instant:** a push to `main` is live on squared.today in a minute, as now. It's the test bench.
- **The app carries its own copy:** every change, even a word, is a new build on the Mac and Apple's review (usually about a day).
- **The rhythm:** tweak freely on the web, then send one app update about once a week, or when something real is ready.
- **Bugs:** ask Apple for an expedited review.
- **Later, only if the weekly rhythm hurts:** a live update service (Capgo, for example) sends small changes to the app without review. It's one more paid service and more moving parts, so not for the first version.
- **Not doing:** an app that just loads squared.today. Tweaks would be instant, but Apple tends to reject it (4.2).

## 6 · TestFlight, then the store

- [ ] **Internal testing** (nomi only, no review): live with it for a few days.
- [ ] **External testing** (up to 10,000 testers, by link): a light review first. This can be the beta. Who to invite and what to ask: `docs/6-beta2-testflight.md`.
- [ ] **Submit for review** with the test account and notes for the reviewer.
- [ ] After approval: release by hand, not automatically, so it goes out when nomi is ready.

## Open questions

- Android too, later? Capacitor does both from the same code, but one store at a time.
- Should squared.today get a "get the app" link once it's live, or stay quiet?
