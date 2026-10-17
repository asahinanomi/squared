import type { Days } from './days'
import { addYears, daysBetween } from './life'
import type { Paint } from './paints'

export type SliceId = Paint | 'unpainted' | 'ahead'
export type Slice = { id: SliceId; count: number }

/** Clockwise from 12 o'clock, and the legend's order. */
export const SLICE_ORDER: SliceId[] = ['green', 'red', 'grey', 'unpainted', 'ahead']

/**
 * A whole life in slices: painted days by colour (backfilled counts the same), lived days left
 * unpainted, and the days still to come — today among them until it's painted, like the life glass.
 */
export function lifeSlices(days: Days, born: string, lifespan: number, today: string): Slice[] {
  const end = addYears(born, lifespan) // first day after the life
  const total = daysBetween(born, end)
  const lived = Math.min(Math.max(daysBetween(born, today) + (days[today] ? 1 : 0), 0), total)
  const painted: Record<Paint, number> = { green: 0, red: 0, grey: 0 }
  for (const [iso, d] of Object.entries(days)) if (iso >= born && iso <= today && iso < end) painted[d.color]++
  const sum = painted.green + painted.red + painted.grey
  const count: Record<SliceId, number> = { ...painted, unpainted: lived - sum, ahead: total - lived }
  return SLICE_ORDER.map((id) => ({ id, count: count[id] }))
}
