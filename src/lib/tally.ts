import { fromIso, isoDate } from './dates'
import type { Days } from './days'
import { PAINTS } from './paints'

/** One band of an aggregate square: a color and its share of the lived days (0–1). */
export type Band = { fill: string; share: number }

/**
 * The rising bands for a stretch of days (a month, a year): green from the bottom, then grey,
 * then red — each split into days painted on the day (solid) and painted later (lighter).
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
      const key = day.color + (day.backfilled ? ':tint' : '')
      counts.set(key, (counts.get(key) ?? 0) + 1)
    }
  }
  const out: Band[] = []
  for (const p of PAINTS)
    for (const [suffix, fill] of [
      ['', p.hex],
      [':tint', p.tint],
    ] as const) {
      const n = counts.get(p.id + suffix) ?? 0
      if (n) out.push({ fill, share: n / lived })
    }
  return out
}

/** Last day of the month containing `iso`. */
export const monthEnd = (iso: string) => {
  const d = fromIso(iso)
  return isoDate(new Date(d.getFullYear(), d.getMonth() + 1, 0))
}
