// The question's tense follows the day. Today, while it's still blank and before the evening (6pm), it asks about
// now: "am I spending Today meaningfully?". In the evening, or once today is painted, it looks back: "did I spend
// Today meaningfully?". Any other day: "did I spend this day meaningfully?".

const EVENING = 18

/** Today, now: still being lived (blank, and before 6pm). */
export const stillToday = (painted: boolean, now = new Date()) => !painted && now.getHours() < EVENING

/** The question for a day, from the live question (the `settings` table, or the fallback). */
export function questionFor(base: string, isToday: boolean, painted: boolean): string {
  if (!isToday) return base.replace(/\bToday\b/, 'this day')
  return stillToday(painted) ? base.replace(/^did I spend\b/, 'am I spending') : base
}
