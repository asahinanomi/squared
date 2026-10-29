import type { Paint } from './paints'

// Words for past days (nomi, Oct 29, 2026): a painted day before today closes with "This day is in colour." and one
// line from its colour's pool. squared listens, then speaks back. Never a verdict, a conscience not a coach, no
// pressure; worth it is about the choice (spent on what matters), never how the day felt. The pools were written and
// edited in "squared: words for past days": https://claude.ai/artifact/UfASTFU84pv9CXBzfr8ZMD
const POOLS: Record<Paint, string[]> = {
  red: [
    "A hard day. You're allowed to feel it.",
    "Regret means you care about something. That's worth knowing.",
    "This day doesn't get to decide who you are.",
    'Some days are heavy to look at. You looked.',
    "Be as kind to yourself as you'd be to a friend.",
    'You looked back honestly. That takes courage.',
    "It happened. It's painted. You can set it down.",
    "This day is painted. Today isn't, yet.",
  ],
  green: [
    'You spent this day meaningfully.',
    'You made room for what matters.',
    'A day lived on purpose.',
    'You honoured what matters to you.',
    'You showed up for what matters.',
    'You lived by what you care about.',
    'Your time went where your heart is.',
    'A day you can stand behind.',
  ],
  grey: [
    "Some days just pass. That's okay.",
    'Not every day needs a story.',
    'Not remembering is part of being human.',
    'Rest counts, too.',
    'A quiet one. Those count as well.',
    "You don't have to make every day mean something.",
    'Some days are just in between.',
    'Noticing the blur is already a kind of paying attention.',
  ],
}

/** The day's own line: picked by its date, so a day always says the same thing when you come back. */
export function pastLine(paint: Paint, iso: string): string {
  let h = 0
  for (const ch of iso) h = (h * 31 + ch.charCodeAt(0)) >>> 0
  const pool = POOLS[paint]
  return pool[h % pool.length]
}

/** The longest of the day's three possible lines: its place is held while the day is blank, so painting never moves
 *  the square. */
export const longestPastLine = (iso: string) =>
  (['green', 'red', 'grey'] as Paint[]).map((p) => pastLine(p, iso)).reduce((a, b) => (b.length > a.length ? b : a))
