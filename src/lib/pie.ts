import type { Days } from './days'
import { addYears, daysBetween } from './life'
import type { Paint } from './paints'

export type SliceId = Paint | 'unpainted' | 'ahead'
export type Slice = { id: SliceId; count: number }

/** Clockwise from 12 o'clock, and the legend's order. */
export const SLICE_ORDER: SliceId[] = ['green', 'red', 'grey', 'unpainted', 'ahead']

/** Which days the pie is out of, widest first: a whole life, the days lived so far, or the painted days only. */
export type Scope = 'life' | 'lived' | 'painted'

/** Zooming in on the pie steps along this, from the whole life to the painted days. */
export const SCOPE_ORDER: Scope[] = ['life', 'lived', 'painted']

/**
 * A life in slices: painted days by colour (backfilled counts the same), lived days left
 * unpainted, and the days still to come — today among them until it's painted, like the life glass.
 * "lived" drops the days still to come; "painted" keeps the colours only.
 */
export function lifeSlices(days: Days, born: string, lifespan: number, today: string, scope: Scope = 'life'): Slice[] {
  const end = addYears(born, lifespan) // first day after the life
  const painted: Record<Paint, number> = { green: 0, red: 0, grey: 0 }
  for (const [iso, d] of Object.entries(days)) if (iso >= born && iso <= today && iso < end) painted[d.color]++
  const total = daysBetween(born, end)
  const lived = Math.min(Math.max(daysBetween(born, today) + (days[today] ? 1 : 0), 0), total)
  const sum = painted.green + painted.red + painted.grey
  const count: Record<SliceId, number> = { ...painted, unpainted: lived - sum, ahead: total - lived }
  const ids = SLICE_ORDER.slice(0, scope === 'painted' ? 3 : scope === 'lived' ? 4 : 5)
  return ids.map((id) => ({ id, count: count[id] }))
}
