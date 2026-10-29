import type { Paint } from './paints'

// Words for past days (nomi, Oct 29, 2026): a painted day before today closes with one line from its colour's pool, as
// the heading itself (2 lines at most on a phone, so every line is short). squared listens, then speaks back. Never a verdict, a conscience not a coach, no
// pressure; worth it is about the choice (spent on what matters), never how the day felt. The pools were written and
// edited in "squared: words for past days": https://claude.ai/artifact/UfASTFU84pv9CXBzfr8ZMD
const POOLS: Record<Paint, string[]> = {
  red: [
    "A hard day. You're allowed to feel it.",
    'Regret means you care.',
    "This day doesn't decide who you are.",
    'Heavy to look at. You looked.',
    'Be as kind to yourself as to a friend.',
    'Looking back honestly takes courage.',
    "It's painted. You can set it down.",
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
    'Not remembering is human.',
    'Rest counts, too.',
    'A quiet one. Those count too.',
    'Not every day has to mean something.',
    'Some days are just in between.',
    'Seeing the blur is paying attention.',
  ],
}

/** The day's own line: picked by its date, so a day always says the same thing when you come back. */
export function pastLine(paint: Paint, iso: string): string {
  let h = 0
  for (const ch of iso) h = (h * 31 + ch.charCodeAt(0)) >>> 0
  const pool = POOLS[paint]
  return pool[h % pool.length]
}
