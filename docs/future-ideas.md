# squared — future ideas

Ideas parked for later. Not promises, not in order. When one ships, move it into the README.

## ⭐ Top priority: private notes (end-to-end encryption)

Decided Oct 23, 2026: keep data as it is for beta (locked to each account, encrypted on Supabase's disks, not end-to-end; the privacy page says so plainly). Do this first after beta, or sooner if testers ask.

- **What**: notes (the sensitive part of a journal) encrypted on your device before they're saved, so no one but you can read them, not even the maker. Squares (just colours) and what matters may stay as they are, or follow later.
- **Why**: the journal leaders do it. Day One encrypts end to end by default, with the key made on the device; Penzu's paid tier uses a key partly made from your password, so the company can't unlock entries.
- **The trade-offs to design carefully** (solid over clever): a passphrase you enter once per device, a recovery option (or a plain warning that a lost passphrase means lost notes), and export and search working on the device. Existing notes would be encrypted once, on your device.
- **Before building**: a lab for the passphrase moments (set it, enter it on a new device, forgot it), and a short plan of the simplest safe design.

## A morning intention (noted Oct 24, 2026)

On today's blank canvas, a gentle line in the morning: "what would make today worth it?" A few words, shown quietly on the square all day; at night you paint honestly against it. Choosing now, not only judging later. Needs one new column (a migration) and a lab first: where it sits on the canvas.

## A real lock: Face ID or a passcode (noted Oct 23, 2026)

Today "lock when I leave" signs out, and Google sign-in is the unlock (two taps). Day One instead stays signed in and locks the app with a passcode or Face ID, with a "require after" timer. On the web, the polished version is a passkey (Face ID / Touch ID through the browser): unlock without signing out. More code than the sign-out lock; do it alongside private notes encryption.

## The colours, for the hardest days (thinking it through, Oct 23, 2026)

Real human moments many people will have: a day that mattered more than any other, but went badly. (nomi's: telling her daughter about the divorce, bluntly; "I broke her heart.") None of the three colours holds it: the model's empty cell is "went to what matters, but I wasn't there for it".

- **Red becomes regret** (leaning yes): red means "the day went *against* what matters", whether it was wasted or did harm. The label **regret** (instead of empty, which fits a wasted day but not a day of harm), with the one-liner "no, it went against what matters to me." Green: spent on what matters; red: went against it; grey: wasn't there for it. It touches the locked brand (labels, the idea letter, the pie, onboarding, the brand story), so decide carefully; a lab first, empty vs regret side by side.
- **A "marked" day**: a ring or outline on any colour, like framing but for days that changed you, good or bad. The colour stays an honest answer; the mark says "this one is to remember".
- A day like the day nomi's dad died ("I was there, I said I forgive him") shows green already works for painful days: meaningful is "not a good day or a bad one", and framing it, with "what do you want to remember?", holds it.


- **Painting styles when keeping one.** On "keep this painting", offer a few templates to choose from: oil, watercolour, brush and so on. The same month, painted in another manner. (The lab already tried brushstrokes and watercolour beside the current soft style: https://claude.ai/artifact/V8up29C1WmH7MXz8BBMdLE)
- **Order a print or a magnet** of a month or year. The paintings are square for this.
- **Share my paintings, see my friends' paintings.** Send a kept painting to a friend (a private link, or the share sheet as an image), and see the paintings friends choose to share with you. Only paintings, never squares or notes, and only ones you pick. To think through first: it's the first social feature (no likes, no counts, no feed pressure, in keeping with no streaks, no scores), how friends find each other, and what it means for privacy (a shared link is public to whoever has it).

## A life

- **A life dashboard**: one page for your whole life, beyond the home card's "days ahead" (which links to a life in days for now): lived and ahead, the pie (the most striking picture of a life; it leaves the bar and home, and lives here), how your painted days split, your years side by side, and more.

## Days

- **My framed days**: a page for the days you framed, maybe in settings beside my paintings.
- **A photo on a framed day**: let you add an image to a day you framed, to keep with it.
- **Your own special days** (special days, step 2): add your own in settings (a `special_days` table).
- **Hashtags in notes**: nomi is trying them by hand first.

## Later, with an iPhone app

- **An evening nudge**: a quiet reminder to paint the day.

## Before adding Google Analytics or Google Ads (noted Oct 22, 2026)

- The content policy in `vercel.json` only allows squared's own scripts: GA (`googletagmanager.com`, `google-analytics.com`) and Ads tags must be added to `script-src`, `connect-src` and `img-src`, or they're blocked.
- The privacy page must say it plainly: what's collected (pages visited, the browser, not your squares or notes), by whom (Google), and how to opt out. For testers in the EU and the UK, a cookie consent banner before anything loads.
- Keep it off the signed-in screens if possible (landing and sign-in only), so nothing about your days is ever near it.
