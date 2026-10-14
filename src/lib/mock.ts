import type { Paint } from './paints'
import { addDays, sameMonth, todayIso } from './dates'
import type { Days } from './days'

// Demo mode only (no Supabase env vars): a few fake painted days earlier this month.
export function mockDays(): Days {
  const pattern: (Paint | null)[] = ['grey', 'green', null, 'green', 'grey', 'red', 'green', null, 'green', 'grey', 'green']
  const today = todayIso()
  const out: Days = {}
  pattern.forEach((color, i) => {
    const iso = addDays(today, -(i + 1))
    if (color && sameMonth(iso, today)) out[iso] = { color }
  })
  return out
}
