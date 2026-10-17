import type { Days } from './days'
import { addYears, daysBetween } from './life'
import type { Paint } from './paints'

export type SliceId = Paint | 'unpainted' | 'ahead'
export type Slice = { id: SliceId; count: number }

/** Clockwise from 12 o'clock, and the legend's order. */
export const SLICE_ORDER: SliceId[] = ['green', 'red', 'grey', 'unpainted', 'ahead']

/** Which days the pie is out of: a whole life, from the first painted day on, or the painted days only. */
export type Scope = 'life' | 'started' | 'painted'

/**
 * A life in slices: painted days by colour (backfilled counts the same), lived days left
 * unpainted, and the days still to come — today among them until it's painted, like the life glass.
 * "started" counts from the first painted day (today, if none yet); "painted" keeps the colours only.
 */
export function lifeSlices(days: Days, born: string, lifespan: number, today: string, scope: Scope = 'life'): Slice[] {
  const end = addYears(born, lifespan) // first day after the life
  const painted: Record<Paint, number> = { green: 0, red: 0, grey: 0 }
  let first = today
  for (const [iso, d] of Object.entries(days))
    if (iso >= born && iso <= today && iso < end) {
      painted[d.color]++
      if (iso < first) first = iso
    }
  const from = scope === 'started' ? first : born
  const total = Math.max(daysBetween(from, end), 0)
  const lived = Math.min(Math.max(daysBetween(from, today) + (days[today] ? 1 : 0), 0), total)
  const sum = painted.green + painted.red + painted.grey
  const count: Record<SliceId, number> = { ...painted, unpainted: lived - sum, ahead: total - lived }
  const ids = scope === 'painted' ? SLICE_ORDER.slice(0, 3) : SLICE_ORDER
  return ids.map((id) => ({ id, count: count[id] }))
}
