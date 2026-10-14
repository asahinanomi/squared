import type { Paint } from './paints'
import { addDays, sameMonth, todayIso } from './dates'

export type Day = { color: Paint; note?: string }

// Step 2 only: a few fake painted days earlier this month. Replaced by Supabase in step 5.
export function mockDays(): Record<string, Day> {
  const pattern: (Paint | null)[] = ['grey', 'green', null, 'green', 'grey', 'red', 'green', null, 'green', 'grey', 'green']
  const today = todayIso()
  const out: Record<string, Day> = {}
  pattern.forEach((color, i) => {
    const iso = addDays(today, -(i + 1))
    if (color && sameMonth(iso, today)) out[iso] = { color }
  })
  return out
}
