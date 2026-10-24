// The question's tense follows the day. Today, until it's painted, it asks about now: "am I spending Today
// meaningfully?". Once today is painted, it looks back: "did I spend Today meaningfully?". Any other day: "did I spend
// this day meaningfully?".

/** Today, now: still being lived (not painted yet). */
export const stillToday = (painted: boolean) => !painted

/** The question for a day, from the live question (the `settings` table, or the fallback). */
export function questionFor(base: string, isToday: boolean, painted: boolean): string {
  if (!isToday) return base.replace(/\bToday\b/, 'this day')
  return stillToday(painted) ? base.replace(/^did I spend\b/, 'am I spending') : base
}
