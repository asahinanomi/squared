import type { Paint } from './paints'
import { addDays, todayIso } from './dates'
import type { Days } from './days'

// Demo mode only (no Supabase env vars): about two years of fake days, so every zoom level has
// something to show. Mostly painted, some skipped, older ones often backfilled. Same every load.
export function mockDays(): Days {
  const today = todayIso()
  const out: Days = {}
  let seed = 7
  const rand = () => (seed = (seed * 16807) % 2147483647) / 2147483647
  for (let i = 1; i <= 730; i++) {
    const r = rand()
    if (r < 0.18) continue // a day left blank
    const color: Paint = r < 0.62 ? 'green' : r < 0.86 ? 'grey' : 'red'
    out[addDays(today, -i)] = { color, backfilled: rand() < (i > 60 ? 0.5 : 0.15) }
  }
  return out
}
