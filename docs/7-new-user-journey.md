# The new user's journey

_last updated Nov 5, 2026_

Every moment squared shows someone new, in the order they meet it: what they see, when it shows, when it stops, and how to test it on your own account. squared has no onboarding tour on purpose: each hint comes at the moment it's useful, points at the real control, goes at a touch (or after 10 seconds, fading out, never just vanishing), and stops once it has done its job. Most hints teach once: once it's done, it's learnt. The zoom is taught twice (8 and 9), since nothing else brings it back. Every bubble points with its own tail; its words carry no arrow (→, ↑). Only one hint shows at a time (`src/lib/oneHint.ts`): whichever is due first takes the moment, any other skips that time and comes back on a later visit. Add every new first-time moment here.

Test links save nothing; they're listed in full in `docs/test-links.md`. Open them signed in, on your phone. "Per device" below means remembered on that phone or browser only; "with the account" means everywhere you sign in.

## 1. Sign-in

- **Sees:** the question, "continue with Google", the line "by continuing, you’re 18+ and agree to the terms and privacy policy." under it, and the idea (the letter) behind "the idea".
- **When:** signed out. **Test:** sign out, or a private window.

## 2. The first visit's sheet

- **Sees:** "Each square is one day of your life." with the three colours' meanings, "Today is yours to paint.", and "got it".
- **When:** the first visit on a device, with nothing painted and no birth date. **Stops:** once closed (per device).
- **Test:** `?welcome`.

## 3. How to paint, acted out

- **Sees:** on a blank today, the way it really works: a pointing hand (ink keyline and white, like the palette; lab B) taps the green well with its fingertip, which loads exactly as a real tap loads it (its splash of drops and its swirl), and the brush takes the green where it rests; the fingertip then paints a faint round trip across the square, as wide as the real brush: lower left up to upper right, then back just below, fading from halfway back (a ghost, never a colour, kept inside the square), and lifts away; the brush goes clean. (It was a brush flying to the well, which taught carrying the brush.)
- **When:** every time today opens blank, until the first square is ever painted; it waits until no sheet covers the day and starts as one slides away. **Stops:** at any touch; never again once a square is painted; never with reduce motion.
- **Test:** `?firstpaint` (on a blank today).

## 4. No colour, no brush

- **Sees:** over the square with no colour picked, the plain pointer (not the brush) and the square's line "pick a colour / first"; the three colours hop.
- **When:** on a computer, while the cursor is over the square; on a phone, for a few seconds after a dry touch. **Stops:** once a colour is picked. Start over cleans the brush too.
- **Test:** open a blank day and touch or hover the square without picking a colour.

## 5. A colour's meaning

- **Sees:** on each dip, one quiet line under the palette with the colour's dot ("yes, I spent it on what matters.").
- **When:** every dip. **Stops:** after a few seconds, or at the next touch.

## 6. The answer, at once

- **Sees:** the moment the square fills, its sound (a drop, a pebble in a well, sand) and the day's word ("worth it") writing itself in, faint, deepening as the paint dries.
- **When:** every painting.

## 7. "because…", then the day's line

- **Sees:** the "because…" bubble; while it's open the question stays up; as it closes (written or skipped) the day's line ("Today, spent on what matters.", or a past day's own words) writes itself in, word after word.
- **When:** every painting, any day. **Stops:** opening a painted day, or stepping to another, never plays it.
- **Also there:** "+ add this to what matters" in the bubble, on a worth-it or regret day, once you've written a few words.

## 8. "see today in your month"

- **Sees:** an ink bubble by zoom out, which hops once; a tap opens the month with the new square in it.
- **When:** as "because…" closes on today, until the zoom is learnt. **Stops:** at another touch or after 10 seconds. **Taught twice:** after the first zoom out it comes back on the next visit (opening squared fresh, signing in, or coming back after 15 minutes away) until they zoom out again. Once they've zoomed out in two different visits, it stops for good (per device).
- **Test:** `?hintmonth` (shows as today opens).

## 9. "see your whole life"

- **Sees:** on the month view, an ink bubble by zoom out.
- **When:** every month visit until zooming out to a life is learnt, the same way: twice, in two different visits (per device). **Stops:** at a touch or after 10 seconds.
- **Test:** `?hintlife` (then zoom out to the month).

## 9b. "see your whole life ›", in the list

- **Sees:** the list's first card, where earlier days would be: a keyline card with a stack of earlier days folded under it, "see your whole life ›" (it replaced a grey "set your birth date to go further back ›" pill).
- **When:** every time the list opens, until the life is set up. **Test:** an account without a birth date.

## 9c. my days' card, breathing

- **Sees:** on my days, the whole card (this week, this month, this life · see your whole life ›) breathes once, as the page lands (0.3s in): it swells a little and lifts off the paper while the life's ghost bar (fainter than any real bar) pours in from the left, as the real one does, and a "?" in a grey ring (the "now" ring, not known yet) fades in where "now" would be; as all settles, the › of "see your whole life ›" (ink, the heading's size: the card's strongest call) nudges twice; a tap asks the two answers, then opens the life (the square's "be here" breath; the row alone was too subtle).
- **When:** each visit to my days, until the life is set up. Never with reduce motion. Not a bubble, so the one-hint rule doesn't hold it back.
- **Test:** an account without a birth date, then my days.

## 10. Your life in squares

- **Sees:** "See your whole life at once." (from a zoom out, the list's card, or the date picker's "see your whole life ›" under its years), then "when were you born?" inside its box and "how long do you hope to live?" (starting at 80 years, with "US average lifespan: 79 years · men 76, women 81").
- **When:** zooming to a life (or further back) without a birth date. From settings it's titled "your life in squares".
- **Test:** an account without a birth date, or settings → your life in squares.

## 11. A life, pouring in

- **Sees:** in years, months or days, the lived squares land from the top of the screen down to today (a shade darker first, then their grey) over about 3 seconds; today pulses; "You are here." sits under it; the hourglass beside "a life" turns over once.
- **When:** opening a life, and each switch between years, months and days. The very first time is slower and pulses twice (per device). **Stops:** at a touch or scroll; never with reduce motion.
- **Test:** zoom out to a life; `?firstlife` plays the first time again.

## 12. "a day to remember?"

- **Sees:** an ink bubble under "more", on a painted day; a tap opens the sheet (frame it, out of my hands).
- **When:** as "because…" closes, once the life is set up and 3 days are painted. **Stops:** at another touch or after 10 seconds; for good once "more" has been opened (per device).
- **Test:** `?hintframe` (on a painted day).

## 12b. "read your moments back"

- **Sees:** an ink bubble over the list icon in the bottom bar; a tap opens the list, every moment with its day.
- **When:** right after something written is kept (the moment box, "because…", a framed or marked day's words), once they've written 5 (counted per device from Nov 5, 2026), about 1.5 seconds on, when the words have landed and the keyboard has gone. **Stops:** at another touch or after 10 seconds; for good once the list has been opened (per device). Never at the same time as "see today in your month".
- **Test:** `?hintlist` (write a moment, then wait).

## 12c. "find days by colour or #tag"

- **Sees:** in the list, an ink bubble under the filter (the sliders beside "a life").
- **When:** each time the list opens, until the filter has been opened once (per device). **Stops:** at a touch or after 10 seconds; for good once used.
- **Test:** `?hintfilter` (then open the list).

## 12d. "your October, as a painting"

- **Sees:** an ink bubble under a finished month's name and its small picture in the body (on the list, and on the month view when you step back to it; never on the month view's big title, so there's one bubble at a time, on the pattern met everywhere); a tap opens the month's painting, with "download".
- **When:** from the first finished month with days, each time that month's name comes into view, until a painting has been opened from its picture or downloaded once (per device). Opening it from the new month's sheet doesn't count, so the hint is the way back if that sheet was closed. **Stops:** at a touch or after 10 seconds.
- **Test:** `?hintpainting` (then open the list).

## 13. What matters, asked

- **Sees:** on my days, "What makes a day worth it to you?" with a writing box (return, or leaving it, keeps the line); then "you said this matters" with one of your lines.
- **When:** while the worth-it list is empty. **Test:** `?askfirst`.

## 14. Torn

- **Sees:** "torn? paint what won ›" under the palette; a tap opens a short sheet ("Paint what won. Keep the rest in a moment." · "Not your choice? Paint it, then more → out of my hands.").
- **When:** the third dip into green and red (both among them), never for someone with fewer than 7 days painted; it waits until the dip's meaning has faded. **Stops:** when the brush touches the square.

## 15. Now and then

- **The date turns over** from yesterday's on the first look at today each day (per device, per person).
- **A new month's painting** rises once over today, the last month as a painting (January: the whole year), once per person, with the account. Decided once, as squared opens: only if last month already has painted days then; painting a day of last month later never brings it up (it once did, over the square's answer). **Test:** `?month`, `?year`.
- **A birthday:** "Happy 18th birthday." over today, signed "— nomi". **Test:** `?birthday`.
- **The life bar** on my days: its numbers roll and its dot breathes, once a day.

## Walking it end to end

A real first run: sign out, open a private window (or a new Google account), sign in, and go through 1 to 13 in order. On your own account, use the test links above for the moments your account is past (2, 3, 8, 9, 12, 12b, 12c, 12d, 13, and the month and year paintings).
