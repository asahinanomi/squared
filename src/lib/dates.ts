/** Local calendar date as YYYY-MM-DD (never UTC — a day is the day where you are). */
export function isoDate(d: Date): string {
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${m}-${day}`
}

export function fromIso(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export const todayIso = () => isoDate(new Date())
/** How far back the past goes: your birth date, or without one, January of the year of your first square (this year
 *  before any), so no view runs back to years you weren't born. */
export const firstDay = (days: Record<string, unknown>, born?: string) =>
  born ?? `${Math.min(Number(todayIso().slice(0, 4)), ...Object.keys(days).map((k) => Number(k.slice(0, 4))))}-01-01`

export function addDays(iso: string, n: number): string {
  const d = fromIso(iso)
  d.setDate(d.getDate() + n)
  return isoDate(d)
}

/** "Oct 21, 2026" */
export const plainDate = (iso: string) =>
  fromIso(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

/**
 * A first paint is on time (full colour) on the day itself or any time the next day: still an honest
 * memory. Later, its square says when it was painted. The database decides
 * for good (migration 0012); this is the same rule for the optimistic paint.
 */
export function paintedFresh(date: string, now = new Date()): boolean {
  const today = isoDate(now)
  return date === today || date === addDays(today, -1)
}

export function ordinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd']
  const v = n % 100
  return n + (s[(v - 20) % 10] || s[v] || s[0])
}

/** "Monday, Oct 12th, 2026" */
export function longDate(iso: string): string {
  const d = fromIso(iso)
  const weekday = d.toLocaleDateString('en-US', { weekday: 'long' })
  const month = d.toLocaleDateString('en-US', { month: 'short' })
  return `${weekday}, ${month} ${ordinal(d.getDate())}, ${d.getFullYear()}`
}

/** "Sat", "Oct 17", "th", "2026": the day screen's short date, its ordinal suffix kept apart to be raised. */
export function shortDateParts(iso: string) {
  const d = fromIso(iso)
  const day = d.getDate()
  return {
    weekday: d.toLocaleDateString('en-US', { weekday: 'short' }),
    monthDay: `${d.toLocaleDateString('en-US', { month: 'short' })} ${day}`,
    suffix: ordinal(day).slice(String(day).length),
    year: d.getFullYear(),
  }
}

/** "October 2026" */
export const monthTitle = (iso: string) => fromIso(iso).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

/** Sunday-first month layout (the North American calendar): leading nulls, then every date in the month. */
export function monthCells(iso: string): (string | null)[] {
  const d = fromIso(iso)
  const first = new Date(d.getFullYear(), d.getMonth(), 1)
  const days = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate()
  const lead = first.getDay()
  const cells: (string | null)[] = Array(lead).fill(null)
  for (let i = 1; i <= days; i++) cells.push(isoDate(new Date(d.getFullYear(), d.getMonth(), i)))
  return cells
}

/** "Wed" for an ISO date. */
const shortWeekday = (iso: string) =>
  ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][new Date(iso + 'T12:00').getDay()]

/** Under a big day number: "Sat, Oct 2026" (the date written normally, around the number). */
export const dayCaption = (iso: string) =>
  `${shortWeekday(iso)}, ${fromIso(iso).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}`

/** The same date some months back ("2026-10-21" → "2025-10-21" for -12), or null if that month has no such day. */
/** How old you were on a day: whole years and months since your birth date. */
export function ageOn(born: string, iso: string) {
  const [by, bm, bd] = born.split('-').map(Number)
  const [y, m, d] = iso.split('-').map(Number)
  let months = (y - by) * 12 + (m - bm) - (d < bd ? 1 : 0)
  if (months < 0) months = 0
  return { years: Math.floor(months / 12), months: months % 12 }
}

export function monthsAgo(iso: string, n: number): string | null {
  const [y, m, d] = iso.split('-').map(Number)
  const t = new Date(y, m - 1 - n, d)
  return t.getDate() === d ? isoDate(t) : null
}

/** When a moment was written: the time if it was written on its own day ("9:41 pm"), else the date too
 *  ("Oct 29 · 10:02 am"): the date shows only where it says something. The same on the day and in the list. */
export function writtenWhen(at: string, iso: string) {
  const d = new Date(at)
  const time = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }).toLowerCase()
  return isoDate(d) === iso ? time : `${plainDate(isoDate(d))} · ${time}`
}
