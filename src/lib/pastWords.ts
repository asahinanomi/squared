import type { Paint } from './paints'

// Words for past days (nomi, Oct 29, 2026): a painted day before today closes with one line from its colour's pool,
// as the heading itself (2 lines at most on a phone, so every line is short). squared listens, then speaks back. Never
// a verdict, a conscience not a coach, no pressure; worth it is about the choice (spent on what matters), never how
// the day felt. The pools were written and edited in "squared: words for past days":
// https://claude.ai/artifact/UfASTFU84pv9CXBzfr8ZMD

// One line from a pool, chosen by the date: the same day always gets the same line.
const pick = (pool: string[], iso: string) => {
  let h = 0
  for (const ch of iso) h = (h * 31 + ch.charCodeAt(0)) >>> 0
  return pool[h % pool.length]
}

const POOLS: Record<Paint, string[]> = {
  red: [
    "A hard day. You're allowed to feel it.",
    'Regret means you care.',
    'Wishing it were different is human.',
    'Heavy to look at. You looked.',
    'You can hold this one gently.',
    "You'd be kind to a friend. And to you?",
    "It's painted. You can set it down.",
    "You're still here. That counts.",
    "This day is painted. Today isn't, yet.",
  ],
  green: [
    'You spent this day meaningfully.',
    'Your time went where your heart is.',
    'A day lived on purpose.',
    'Hours spent like you meant them.',
    'You made room for what matters.',
    'You showed up for what matters.',
    'Proof of what you care about.',
    'This is what your time is for.',
    'A day you can stand behind.',
  ],
  grey: [
    "Some days just pass. That's okay.",
    'Some days are soft around the edges.',
    'Not every day needs a story.',
    'Memory lets some days go.',
    'Even a blur was lived.',
    'A quiet one. Those count too.',
    'Some days are just in between.',
    'A day that slipped by, gently.',
    'Seeing the blur is paying attention.',
  ],
}

/** The day's own line: picked by its date, so a day always says the same thing when you come back. */
export const pastLine = (paint: Paint, iso: string) => pick(POOLS[paint], iso)

// Holidays and your own days have their own small pools, one per colour, so a special day always speaks to its
// occasion (nomi, Oct 29, 2026). The same care: never a verdict, worth it is the choice, not the feeling. `{n}` is the
// birthday's ordinal ("55th").
const OCCASIONS: Record<string, Record<Paint, string[]>> = {
  birthday: {
    green: ['Your {n} birthday, well spent.', 'A birthday spent on what matters.', 'Another year begins on purpose.'],
    red: [
      "A hard birthday. You're allowed that.",
      'Birthdays can be heavy. You looked.',
      'Not every birthday goes as hoped.',
    ],
    grey: ["A quiet birthday. That's okay.", 'Birthdays can just pass, too.', 'Your {n} birthday, a quiet one.'],
  },
  newyear: {
    green: ['A new year, begun on purpose.', 'The year began with what matters.', "New Year's Day, well spent."],
    red: ['A hard start. The year is still yours.', 'Not the start you hoped for.', 'A heavy first day. You looked.'],
    grey: ['A quiet start to the year.', 'The year began softly.', "A blur of a first day. That's okay."],
  },
  christmas: {
    green: ['Christmas, spent on what matters.', 'Christmas, close to what matters.', 'Christmas, well spent.'],
    red: [
      "Christmas can be hard. That's allowed.",
      'Not the Christmas you hoped for.',
      'A heavy Christmas. Be gentle with yourself.',
    ],
    grey: ["A quiet Christmas. That's okay.", 'Christmas came and went softly.', 'Some Christmases just pass.'],
  },
}

/** A special day's heading, from its occasion ("your 55th birthday", "New Year's Day", "Christmas", "the day you were
 *  born"; the first, when two fall together) and its colour. */
export function occasionLine(special: string, paint: Paint, iso: string): string {
  const first = special.split(' · ')[0]
  const birthday = /^your (\S+) birthday$/.exec(first)
  if (birthday) return pick(OCCASIONS.birthday[paint], iso).replace('{n}', birthday[1])
  if (first === "New Year's Day") return pick(OCCASIONS.newyear[paint], iso)
  if (first === 'Christmas') return pick(OCCASIONS.christmas[paint], iso)
  return `${first[0].toUpperCase()}${first.slice(1)}, in colour.`
}
