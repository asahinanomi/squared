import { fromIso, isoDate } from './dates'

// Where the lifespan starts for someone new: 80, as sign-in's "An 80-year life" and near the average (nomi, Nov 4,
// 2026; was 85). Saved accounts keep theirs.
export const DEFAULT_LIFESPAN = 80

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

// A life's squares, the same in years, months and days (nomi, Nov 5, 2026: months read flat, past and future too
// alike): lived but unpainted a quiet grey; the time ahead greyed out further, nearly the paper (a faint edge only on a
// life's big days), so it reads as slots still to come; before you were born, the paper itself.
export const LIFE_LIVED = '#e2e2da'
export const LIFE_AHEAD = '#f6f6f2'
export const LIFE_AHEAD_EDGE = '#e6e6df'
export const LIFE_BEFORE = '#fafaf8'
