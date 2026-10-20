import { ordinal } from './dates'

/** Days fixed in every calendar: New Year's Day and Christmas (others come with "special days", a later phase). */
const FIXED: Record<string, string> = { '01-01': "New Year's Day", '12-25': 'Christmas' }

/**
 * What makes a day special, in a few words — your birthday (from square settings), New Year's Day, Christmas —
 * or null. Born on Feb 29, your birthday is Feb 28 in a common year.
 */
export function specialDay(iso: string, born?: string): string | null {
  const out: string[] = []
  if (born && iso >= born) {
    const leap = (y: number) => (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0
    const year = Number(iso.slice(0, 4))
    const bday = born.slice(5) === '02-29' && !leap(year) ? '02-28' : born.slice(5)
    if (iso === born) out.push('the day you were born')
    else if (iso.slice(5) === bday) out.push(`your ${ordinal(year - Number(born.slice(0, 4)))} birthday`)
  }
  const fixed = FIXED[iso.slice(5)]
  if (fixed) out.push(fixed)
  return out.length ? out.join(' · ') : null
}
