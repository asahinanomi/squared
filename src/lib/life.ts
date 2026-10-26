import { fromIso, isoDate } from './dates'

export const DEFAULT_LIFESPAN = 85

/** Whole days from a to b (both YYYY-MM-DD), ignoring time zones and clock changes. */
export function daysBetween(a: string, b: string): number {
  const n = (iso: string) => {
    const [y, m, d] = iso.split('-').map(Number)
    return Date.UTC(y, m - 1, d) / 86_400_000
  }
  return Math.round(n(b) - n(a))
}

/** The same calendar date n years later (Feb 29 lands on Feb 28 in a common year). */
export function addYears(iso: string, n: number): string {
  const d = fromIso(iso)
  const out = new Date(d.getFullYear() + n, d.getMonth(), d.getDate())
  if (out.getMonth() !== d.getMonth()) out.setDate(0)
  return isoDate(out)
}

/** Full years lived on `today`. */
function age(born: string, today: string): number {
  const years = Number(today.slice(0, 4)) - Number(born.slice(0, 4))
  return today.slice(5) < born.slice(5) ? years - 1 : years
}

/** A life as squares: every day from birth up to (not including) the hoped-for end. */
export function lifeCounts(born: string, lifespan: number, today: string) {
  const total = daysBetween(born, addYears(born, lifespan))
  const sofar = Math.min(Math.max(daysBetween(born, today), 0), total)
  const left = total - sofar
  return { total, sofar, left, percentLeft: Math.round((left / total) * 100), age: age(born, today) }
}
