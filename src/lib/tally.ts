import { fromIso, isoDate } from './dates'
import type { Days } from './days'
import { FRAME, PAINTS } from './paints'

/** One band of an aggregate square: a color and its share of the lived days (0–1). */
export type Band = { fill: string; share: number }

/**
 * The rising bands for a stretch of days (a month, a year): green from the bottom (its framed days first, in the
 * frame's darker green, so they show even in a whole life), then grey, then red.
 * Shares are of the days already lived in the stretch, so unpainted days stay empty at the top.
 */
export function bands(days: Days, from: string, to: string, today: string, born?: string): Band[] {
  const start = born && born > from ? born : from
  const end = to < today ? to : today
  if (start > end) return []
  const counts = new Map<string, number>()
  let lived = 0
  for (let d = fromIso(start); ; d.setDate(d.getDate() + 1)) {
    const iso = isoDate(d)
    if (iso > end) break
    lived++
    const day = days[iso]
    if (day) {
      const key = day.color + (day.framed && day.color === 'green' ? ':framed' : '')
      counts.set(key, (counts.get(key) ?? 0) + 1)
    }
  }
  const out: Band[] = []
  // The bands keep their own stacking: green, grey, red.
  for (const id of ['green', 'grey', 'red'] as const) {
    const p = PAINTS.find((x) => x.id === id)!
    for (const [suffix, fill] of [
      [':framed', FRAME],
      ['', p.soft],
    ] as const) {
      const n = counts.get(p.id + suffix) ?? 0
      if (n) out.push({ fill, share: n / lived })
    }
  }
  return out
}

/** Last day of the month containing `iso`. */
export const monthEnd = (iso: string) => {
  const d = fromIso(iso)
  return isoDate(new Date(d.getFullYear(), d.getMonth() + 1, 0))
}
