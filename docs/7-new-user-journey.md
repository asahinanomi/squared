# The new user's journey

_last updated Nov 5, 2026_

Every moment squared shows someone new, in the order they meet it: what they see, when it shows, when it stops, and how to test it on your own account. squared has no onboarding tour on purpose: each hint comes at the moment it's useful, points at the real control, goes at a touch, and stops once it has done its job. Add every new first-time moment here.

Test links save nothing; they're listed in full in `docs/test-links.md`. Open them signed in, on your phone. "Per device" below means remembered on that phone or browser only; "with the account" means everywhere you sign in.

## 1. Sign-in

- **Sees:** the question, "continue with Google", the line "by continuing, you’re 18+ and agree to the terms and privacy policy." under it, and the idea (the letter) behind "the idea".
- **When:** signed out. **Test:** sign out, or a private window.

## 2. The first visit's sheet

- **Sees:** "Each square is one day of your life." with the three colours' meanings, "Add moments as they come. Paint the square when the day is done.", and "got it".
- **When:** the first visit on a device, with nothing painted and no birth date. **Stops:** once closed (per device).
- **Test:** `?welcome`.

## 3. How to paint, acted out

- **Sees:** on a blank today, the palette's brush lifts out, dips into green, flies to the square, paints a faint two-sweep stroke (a ghost, never a colour), and flies home clean.
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

## 8. "see today in your month →"

- **Sees:** an ink bubble by zoom out, which hops once; a tap opens the month with the new square in it.
- **When:** as "because…" closes on today, until the person's life is set up (a birth date and lifespan). **Stops:** at another touch or after 15 seconds; for good once the life is set up.
- **Test:** `?hintmonth` (shows as today opens).

## 9. "see your whole life →"

- **Sees:** on the month view, an ink bubble by zoom out.
- **When:** every month visit until the life is set up. **Stops:** at a touch or after 15 seconds; for good once set up.
- **Test:** `?hintlife` (then zoom out to the month).

## 10. Your life in squares

- **Sees:** "See your whole life at once." (from a zoom out) or "Go further back." (from the date picker or the list), then "when were you born?" inside its box and "how long do you hope to live?" (starting at 80 years, with "US average lifespan: 79 years · men 76, women 81").
- **When:** zooming to a life (or further back) without a birth date. From settings it's titled "your life in squares".
- **Test:** an account without a birth date, or settings → your life in squares.

## 11. A life, pouring in

- **Sees:** in years, months or days, the lived squares land from the top of the screen down to today (a shade darker first, then their grey) over about 3 seconds; today pulses; "You are here." sits under it; the hourglass beside "a life" turns over once.
- **When:** opening a life, and each switch between years, months and days. The very first time is slower and pulses twice (per device). **Stops:** at a touch or scroll; never with reduce motion.
- **Test:** zoom out to a life; `?firstlife` plays the first time again.

## 12. "a day to remember?"

- **Sees:** an ink bubble under "more", on a painted day; a tap opens the sheet (frame it, out of my hands).
- **When:** as "because…" closes, once the life is set up and 3 days are painted. **Stops:** at another touch or after 15 seconds; for good once "more" has been opened (per device).
- **Test:** `?hintframe` (on a painted day).

## 12b. "read your moments back ↓"

- **Sees:** an ink bubble over the list icon in the bottom bar; a tap opens the list, every moment with its day.
- **When:** right after something written is kept (the moment box, "because…", a framed or marked day's words), once they've written 5 (counted per device from Nov 5, 2026), about 1.5 seconds on, when the words have landed and the keyboard has gone. **Stops:** at another touch or after 15 seconds; for good once the list has been opened (per device). Never at the same time as "see today in your month →".
- **Test:** `?hintlist` (write a moment, then wait).

## 13. What matters, asked

- **Sees:** on my days, "What makes a day worth it to you?" with a writing box (return, or leaving it, keeps the line); then "you said this matters" with one of your lines.
- **When:** while the worth-it list is empty. **Test:** `?askfirst`.

## 14. Torn

- **Sees:** "torn? paint what won ›" under the palette; a tap opens a short sheet ("Paint what won. Keep the rest in a moment." · "Not your choice? Paint it, then more → out of my hands.").
- **When:** the third dip into green and red (both among them), never for someone with fewer than 7 days painted; it waits until the dip's meaning has faded. **Stops:** when the brush touches the square.

## 15. Now and then

- **The date turns over** from yesterday's on the first look at today each day (per device, per person).
- **A new month's painting** rises once over today, the last month as a painting (January: the whole year), once per person, with the account. **Test:** `?month`, `?year`.
- **A birthday:** "Happy 18th birthday." over today, signed "— nomi". **Test:** `?birthday`.
- **The life bar** on my days: its numbers roll and its dot breathes, once a day.

## Walking it end to end

A real first run: sign out, open a private window (or a new Google account), sign in, and go through 1 to 13 in order. On your own account, use the test links above for the moments your account is past (2, 3, 8, 9, 12, 12b, 13, and the month and year paintings).
