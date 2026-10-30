# squared — future ideas

Ideas parked for later. Not promises, not in order. When one ships, move it into the README.

## Private notes, the Day One way, in the iOS app (rethought Oct 29, 2026)

Not urgent: squared already does what most journals do (notes locked to your account, encrypted on the server's disks; the privacy page says plainly it isn't end to end). This is a trust upgrade for when squared reaches strangers, not a blocker. Regret notes are raw, and "not even I can read them" turns nomi's promise into a fact.

- **How (Day One's way, zero friction):** in the iOS app, notes are encrypted on the phone before they're saved. The key is made on the phone automatically and kept in the iCloud Keychain, so it follows you to your other Apple devices. No passphrase, nothing to set up. Plan: `docs/5-ios-todo.md` → "Private notes".
- **Why not the web now:** the web has no invisible safe place for a key. A passphrase adds friction a new app can't afford (Journey does it opt-in, and loses search). Passkeys can unlock a key with Face ID, but they're new and need a recovery code: clever, not solid. A key kept in the browser isn't reliable (Safari can wipe it), and losing it loses the notes.
- **Later, if you use squared on the web too:** the web unlocks with a passkey or a recovery code, the same trade-off Day One makes on its web app.
- **Now (cheap):** the privacy wording stays plain and honest; note text never goes into logs, crash reports, analytics or emails.

## ⭐ Watch closely: days done to you, a blind spot (noted Oct 30, 2026)

squared asks "did *I* spend Today meaningfully?", and the colours answer about your own choice. But many days are bad out of your choice: as a child, catching a parent in an affair at home; an illness, a layoff, a loss, someone else's decision landing on your day. Past or present. None of the three colours fits: red's "I wish I'd spent it differently" and its signature "regret" can quietly suggest it was your fault. nomi painted such a childhood day red anyway ("I wish this day had gone differently"), the second time after Oct 23's "The colours, for the hardest days".

- **Not now:** changing red's meaning ("I wish this day had gone differently", or "it went against what matters to me") would move the colours from choice toward mood and unsettle the clean yes / no / I don't know answer, pulling the label, palette, pie, idea letter, intro and brand story with it. Considered and held (Oct 30, 2026).
- **Watch in beta 1:** how friends paint their hard days that weren't their choice, and whether "regret" stings on them. Many people will have these.
- **Gentle tools that already exist:** the words (red past days speak without blame; early years say "None of it was yours to choose."), framing with "what do you want to remember?".
- **Options to lab if it's confirmed:** red's wording widened; a "marked day" (a ring for days that changed you, any colour, below); words for red past days that never imply blame; a Questions answer, "What if a hard day wasn't my choice?".

## Torn days: a green and red split square (after beta 1, noted Oct 30, 2026)

Real days can be half worth it, half regret, and one colour feels dishonest. No fourth colour (green and red mixed is mud, and a middle option becomes the easy exit). Instead, maybe a square split in green and red, your two real paints, reached only through the "torn?" sheet ("it was both"), never a button on the day. Its cost: every view, filter, word pool and painting learns split days. Evidence first: nomi notes each torn day in the quiet week (a moment starting "torn"), and beta 1 asks "Were there days you couldn't pick just one colour?". Often → lab it. Rarely → the torn sheet plus a moment's own colour (built Oct 30, 2026, lab 11) may be enough.

## One photo on a framed day (agreed Oct 29, 2026)

One photo per framed day only, to keep with it: rare and special, tucked with the note, never on the square (colour lives in the paint). Built with private notes in the iOS app, encrypted from the start, so it's done once. Shrunk on the phone before upload, private storage, deleted when the day is unframed or the account goes. Beta 1 can confirm the wish. Later, in the iOS app: a quiet "photos from this day" that reads your own library on the phone, storing and uploading nothing.

## The past: lived, not blank (thinking it through, Oct 25, 2026)

**Why it came up.** nomi painted heavy, painful years from before squared, and doesn't want to revisit them again. squared asks "how many squares?" from birth, so most of a life starts blank, and the days before you started can never all be painted. Blank squares read as unfinished: the zoom quietly calls you to fill them.

**Torn, both ways true.** The life view from birth gives today its weight (essential). Painting a hard day made nomi treasure why today matters. And squared can be a life journal: "I want a life view when I'm 89, to see my life as a whole." But most people carry hard years, and an app that points them back may lose them.

**The idea.** Days before you started show as **lived** (a quiet ink tone, like the life bar's past), not blank canvas. Painted = the days you chose to keep. Blank = only today and the days ahead. Matches the line: the past is painted, today is still yours.

**The journal path stays open.** Recommended: no lock, lived days are always paintable (tap one, paint it, it turns to colour). Second option: an "unlock" setting ("my past: lived / to paint") that shows the past as blank canvas, for people who choose to fill it.

**Decided: wait for testers.** nomi's feeling may not be everyone's, and testers won't go as deep in two weeks. So hold it, watch what they do with things as they are (do they paint past days? how far back? do they stop after a hard day?), and ask on day 14 (`docs/6-beta2-testflight.md`). Then decide. Risks to solve in a lab: the lived tone must never read as grey paint ("a blur"); squared needs to know the day you started (joined, not first painted). The principle is in the brand story, section 2.

**First evidence, nomi (Oct 29, 2026): painting the past turns red.** Logging past days, nomi found a lot of regret days. Memory keeps the days we wish had gone differently (the hard ones, the missed chances, what we didn't do), while ordinary okay days fade, so a painted past can look redder than it was. Honest, and it's what "today is still yours" answers. But it may weigh on testers: backfilling and seeing mostly red could feel worse, not better. Watch in beta 1 (do people paint the past, how far back, and question 5, how it felt). If it reads heavy, gentle options to lab: a kind line when a past day is painted red; "a blur" made to feel like a fair answer for days you don't remember; or the lived idea above.

## Far-back words, stronger with distance (noted Oct 29, 2026)

From 3 years back, far-back lines mix into a painted day's colour pool. If wanted later: from 10 years back, they come up more often.

## The pie, parked (Oct 26, 2026)

**Cut from my days** ("a life, in slices"): a breakdown of your days by colour, in percentages, read as stats for their own sake, and the squares already show a life in colour. **The code is kept, unreachable**: `src/screens/Pie.tsx` and `src/lib/pie.ts` (zoom steps whole life → days I lived → painted only, "see them →" into the list). To bring it back, give it a door again (it was a row in my days opening `nav.openPie`).

**A better use, nomi's idea: a pie as a way to paint.** When you paint a square, choose a *pie pattern* instead of the brush strokes: the paint fans out from the lower-left corner in slices toward the right, like sunlight rising from the bottom left. The square would read as a sunrise of your day. Worth a lab when painting gets its next round: how you'd choose it (a quiet option, never in the way of the brush), how it looks in each colour, and whether it shows in the month, the life and the paintings as it does on the day.

## An email when an account is deleted (low priority, noted Oct 25, 2026)

**Low priority:** not required by Apple or privacy law; the goodbye screen already confirms it. Pick it up when squared sends other mail.

nomi asked for an email confirming the account is gone. **Already in place** (from the feedback form): Resend, its key in Supabase's secrets, the `feedback-email` server function, and squared.today verified in Resend (DNS done), so squared can email anyone, not only nomi. **Still to build:** a small `delete-account` server function the app calls instead of today's database delete: it reads the account's email, deletes the account (everything goes with it, migration 0020), then sends "Your squared account has been deleted." nomi deploys it in the Supabase editor, like feedback-email. Moderate work, not complex.

## A morning intention (parked Oct 24, 2026)

"What would make today worth it?": a line set in the morning, seen all day, painted against at night. Lovely, but it makes today more complex (a second thing beside the one question), so it's parked, maybe as its own feature one day. Lab: https://claude.ai/artifact/8FfES4Aj94FZq4QLmJyUww (A on the canvas, B under the question, C as the first card; how you set it; what it becomes at night). A tiny version if it's ever wanted: the morning's empty "add a moment" box hints "what would make today worth it?", saved as an ordinary moment.

## A real lock: Face ID or a passcode (noted Oct 23, 2026)

Today "lock when I leave" signs out, and Google sign-in is the unlock (two taps). Day One instead stays signed in and locks the app with a passcode or Face ID, with a "require after" timer. On the web, the polished version is a passkey (Face ID / Touch ID through the browser): unlock without signing out. More code than the sign-out lock; do it alongside private notes encryption.

## The colours, for the hardest days (thinking it through, Oct 23, 2026)

Real human moments many people will have: a day that mattered more than any other, but went badly. (nomi's: telling her daughter about the divorce, bluntly; "I broke her heart.") None of the three colours holds it: the model's empty cell is "went to what matters, but I wasn't there for it".

- **Red becomes regret** (leaning yes): red means "the day went *against* what matters", whether it was wasted or did harm. The label **regret** (instead of empty, which fits a wasted day but not a day of harm), with the one-liner "no, it went against what matters to me." Green: spent on what matters; red: went against it; grey: wasn't there for it. It touches the locked brand (labels, the idea letter, the pie, onboarding, the brand story), so decide carefully; a lab first, empty vs regret side by side.
- **A "marked" day**: a ring or outline on any colour, like framing but for days that changed you, good or bad. The colour stays an honest answer; the mark says "this one is to remember".
- A day like the day nomi's dad died ("I was there, I said I forgive him") shows green already works for painful days: meaningful is "not a good day or a bad one", and framing it, with "what do you want to remember?", holds it.


- **Painting styles when keeping one.** On "keep this painting", offer a few templates to choose from: oil, watercolour, brush and so on. The same month, painted in another manner. (The lab already tried brushstrokes and watercolour beside the current soft style: https://claude.ai/artifact/V8up29C1WmH7MXz8BBMdLE)
- **A month's painting arrives as a gift.** It already arrives once, on the first visit of a new month. Next: make it feel like a small gift being unwrapped, signed, then offered to keep or share. The reward for showing up, and the way squared travels (`docs/8-growth.md`). Lab first.
- **Order a print or a magnet** of a month or year. The paintings are square for this.
- **Share my paintings, see my friends' paintings.** Send a kept painting to a friend (a private link, or the share sheet as an image), and see the paintings friends choose to share with you. Only paintings, never squares or notes, and only ones you pick. To think through first: it's the first social feature (no likes, no counts, no feed pressure, in keeping with no streaks, no scores), how friends find each other, and what it means for privacy (a shared link is public to whoever has it).

## A life

- **A life dashboard**: one page for your whole life, beyond the home card's "days ahead" (which links to a life in days for now): lived and ahead, the pie (the most striking picture of a life; it leaves the bar and home, and lives here), how your painted days split, your years side by side, and more.

## Days

- **My framed days**: a page for the days you framed, maybe in settings beside my paintings.
- **Your own special days** (special days, step 2): add your own in settings (a `special_days` table).
- **Hashtags in notes**: nomi is trying them by hand first.

## Later, with an iPhone app

- **An evening nudge**: a quiet reminder to paint the day.

## Before adding Google Analytics or Google Ads (noted Oct 22, 2026)

- The content policy in `vercel.json` only allows squared's own scripts: GA (`googletagmanager.com`, `google-analytics.com`) and Ads tags must be added to `script-src`, `connect-src` and `img-src`, or they're blocked.
- The privacy page must say it plainly: what's collected (pages visited, the browser, not your squares or notes), by whom (Google), and how to opt out. For testers in the EU and the UK, a cookie consent banner before anything loads.
- Keep it off the signed-in screens if possible (landing and sign-in only), so nothing about your days is ever near it.
- **A copy pass, as a dialog** (nomi, Oct 28, 2026): read every title, prompt and empty state and make it sound like squared talking with you (see brand story, voice principles).
