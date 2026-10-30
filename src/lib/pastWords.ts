import type { Days } from './days'
import type { Paint } from './paints'

// Words for past days (nomi, Oct 29, 2026): a painted day before today closes with one line from its colour's pool,
// as the heading itself (2 lines at most on a phone, so every line is short). squared listens, then speaks back. Never
// a verdict, a conscience not a coach, no pressure; worth it is about the choice (spent on what matters), never how
// the day felt. The same truth in fresh words is welcome (identical words wear out, varied ones feel personal): only
// weak lines are cut. The pools were written and edited in "squared: words for past days":
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
    "It's painted. You can set it down.",
    "You're still here. That counts.",
    "This day is painted. Today isn't, yet.",
    'Looking back honestly takes courage.',
    "And still, you're here.",
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
    'You honoured what matters to you.',
    'You were where you needed to be.',
    'And this one, you chose.',
  ],
  grey: [
    'Some days simply pass.',
    'Some days are soft around the edges.',
    'Not every day needs a story.',
    'Memory lets some days go.',
    'Even a blur was lived.',
    'A quiet one. Those count too.',
    'Some days are just in between.',
    'A day that slipped by, gently.',
    'Seeing the blur is paying attention.',
    'Not every day has to mean something.',
    'A quiet page, still yours.',
  ],
}

// Holidays and your own days have their own small pools, one per colour, so a special day always speaks to its
// occasion (nomi, Oct 29, 2026). The same care: never a verdict, worth it is the choice, not the feeling. `{n}` is the
// birthday's ordinal ("55th").
const OCCASIONS: Record<string, Record<Paint, string[]>> = {
  birthday: {
    green: [
      'Your {n} birthday, well spent.',
      'Your {n} birthday, spent on what matters.',
      'Your {n} birthday. A year begins on purpose.',
      'And then you were {a}.',
    ],
    red: [
      "A hard {n} birthday. You're allowed that.",
      'Your {n} birthday. Heavy, and you looked.',
      'Your {n} birthday. It still counts.',
    ],
    grey: ['Your {n} birthday, softly come and gone.', 'Your {n} birthday, a quiet one.'],
  },
  newyear: {
    green: [
      'A new year, begun on purpose.',
      'The year began with what matters.',
      "New Year's Day, well spent.",
      'And so, a new year.',
    ],
    red: [
      'A hard start. The year is still yours.',
      'Not the start you hoped for. The rest is unwritten.',
      'A heavy first day. You looked.',
    ],
    grey: ['A quiet start to the year.', 'The year began softly.', 'The year began in a soft blur.'],
  },
  christmas: {
    green: ['Christmas, spent on what matters.', 'Christmas, and your heart was in it.', 'Christmas, well spent.'],
    red: ['Christmas can be heavy, too.', 'Not the Christmas you hoped for.', 'A heavy Christmas, seen.'],
    grey: [
      'A quiet Christmas, gently held.',
      'Christmas came and went softly.',
      'Some Christmases just pass.',
      'Once more, Christmas.',
    ],
  },
}

/** A special day's heading, from its occasion ("your 55th birthday", "New Year's Day", "Christmas", "the day you were
 *  born"; the first, when two fall together) and its colour. */
function occasionLine(special: string, paint: Paint, iso: string): string {
  const first = special.split(' · ')[0]
  const birthday = /^your (\S+) birthday$/.exec(first)
  if (birthday)
    return pick(OCCASIONS.birthday[paint], iso)
      .replace('{n}', birthday[1])
      .replace('{a}', String(parseInt(birthday[1])))
  if (first === "New Year's Day") return pick(OCCASIONS.newyear[paint], iso)
  if (first === 'Christmas') return pick(OCCASIONS.christmas[paint], iso)
  return `${first[0].toUpperCase()}${first.slice(1)}, in colour.`
}

// Words that know where you stand (nomi, Oct 29, 2026): someone who came back to this day, for a reason. Each sub-pool
// takes the strongest main lines, tweaked by hand to its context, plus a few of its own: one voice everywhere.

// Before about 4, nobody remembers (childhood amnesia), and regret or worth it assume a choice a toddler never had. So
// these speak to the grown-up who came back, painting now for the little one they were. No assumptions about what
// happened: not every early childhood was safe.
const EARLY: Record<Paint, string[]> = {
  green: ['You went back for this day.', 'Painted now, for who you were.', 'Your early days, already in colour.'],
  red: [
    "You came back for this. That's brave.",
    'You were small. None of it was yours to choose.',
    'Held gently, all these years later.',
  ],
  grey: [
    'Too young to remember. Time kept it for you.',
    'Early days, held by time, not memory.',
    'Painted from far away.',
    'Once, you were small.',
  ],
}

// The day you were born, any colour: a newborn has no choice to regret or stand behind, so these hold the scale of it.
const BORN = ['Hello, world.', 'Once upon a time, you.', 'And then there was you.']

// The day you started squared, any colour.
const FIRST = ['Your first square. It began here.', 'Square one. Hello, you.']

// You framed it because it matters: three for any colour, one adapted from each colour's pool.
const FRAMED_ANY = ['Of all your days, this one.', 'Worth framing. You knew.', 'Some days ask to be kept.']
const FRAMED: Record<Paint, string> = {
  green: 'Proof of what you care about, kept.',
  red: 'Heavy to look at. You kept it anyway.',
  grey: 'Soft around the edges, and kept.',
}

// 3 years back or more: mixed with the colour's own pool, not instead of it, so old days feel the distance without
// repeating (people often paint a whole old month or year in a row).
const FAR: Record<Paint, string[]> = {
  green: [
    'Years later, still worth it.',
    'You went a long way back for this.',
    'Time kept this one bright.',
    'Years later, still where your heart was.',
  ],
  red: [
    'Years on, you can set it down.',
    'Old, and still tender. You looked.',
    'A long way back. Gently.',
    'Heavy, even from here. You looked.',
  ],
  grey: [
    'A faraway day, softly kept.',
    'Time softened this one.',
    'Painted from far away.',
    'Memory let this one go. You came back.',
    'Once upon a time, this day.',
  ],
}

// Your 18th, 30th, 40th … 100th birthdays. `{a}` is the age, `{n}` the ordinal ("50th").
const MILESTONES = new Set([18, 30, 40, 50, 60, 70, 80, 90, 100])
const MILESTONE: Record<Paint, string[]> = {
  green: [
    '{a} years. A day well spent.',
    'Your {n} birthday, lived on purpose.',
    '{a} years. You made room for what matters.',
    'And then, {a}.',
  ],
  red: ['{a} years, and a heavy day.', 'Your {n}, not as hoped.', "{a} years. You're allowed to feel it."],
  grey: ['{a} years, quietly marked.', 'Your {n} birthday, softly come and gone.', '{a} years, soft around the edges.'],
}

const yearsAfter = (iso: string, years: number) => `${Number(iso.slice(0, 4)) + years}${iso.slice(4)}`

/** The day you started squared: the first date you painted on (any square), if that day itself is painted. */
export function firstSquare(days: Days): string | undefined {
  let start: string | undefined
  for (const [date, d] of Object.entries(days)) {
    const on = d.paintedOn ?? date
    if (!start || on < start) start = on
  }
  return start && days[start] ? start : undefined
}

// Today, painted (nomi, Oct 29, 2026): one big line that always says "today", pointing forward, never naming the colour.
const TODAY: Record<Paint, string> = {
  green: 'Today, spent on what matters.',
  red: 'Today is painted. Tomorrow is still yours.',
  grey: 'Today is painted. Tomorrow, be here.',
}

/** Today's own words: its colour line, or what makes it special (always saying "today"). */
function todayWords(paint: Paint, occasion: string | undefined, first: boolean): string {
  if (first) return 'Today, your first square.'
  const birthday = occasion && /^your (\S+) birthday$/.exec(occasion)
  if (birthday) return `Today, your ${birthday[1]} birthday.`
  if (occasion === "New Year's Day") return 'Today, a new year begins.'
  if (occasion === 'Christmas') return 'Today is Christmas.'
  return TODAY[paint]
}

/**
 * A painted day's heading. Today has its own words (todayWords). For a past day, when it's more than one thing, the
 * strongest wins: the day you were born, then early years (before 4), your first square, a holiday or birthday
 * (milestones first), framed, then the colour's own pool (mixed with far-back lines from 3 years ago).
 */
export function dayWords(o: {
  iso: string
  today: string
  paint: Paint
  special: string | null
  born?: string
  framed?: boolean
  first?: string
}): string {
  const { iso, today, paint, special, born } = o
  const occasion = special?.split(' · ')[0]
  if (iso === today) return todayWords(paint, occasion, iso === o.first)
  if (occasion === 'the day you were born') return pick(BORN, iso)
  if (born && iso < yearsAfter(born, 4)) return pick(EARLY[paint], iso)
  if (iso === o.first) return pick(FIRST, iso)
  if (special) {
    const age = born ? Number(iso.slice(0, 4)) - Number(born.slice(0, 4)) : 0
    if (occasion?.endsWith('birthday') && MILESTONES.has(age)) {
      const n = /^your (\S+) birthday$/.exec(occasion)![1]
      return pick(MILESTONE[paint], iso).replace('{a}', String(age)).replace('{n}', n)
    }
    return occasionLine(special, paint, iso)
  }
  if (o.framed) return pick([...FRAMED_ANY, FRAMED[paint]], iso)
  return pick(iso <= yearsAfter(today, -3) ? [...POOLS[paint], ...FAR[paint]] : POOLS[paint], iso)
}
