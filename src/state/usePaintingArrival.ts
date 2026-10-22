import { useEffect, useState } from 'react'
import { monthsAgo, todayIso } from '../lib/dates'
import type { Days } from '../lib/days'
import { tryMonth, tryYear } from './app'

const PAINTED_KEY = 'squared.paintedMonth' // the month whose arrival last showed a painting (January: the year's)

/** The painting that's open, if any. A new month shows the last one once, as a painting (a new year: the whole last
 *  year); any month or year opens again from its picture icon. */
export function usePaintingArrival(days: Days, waiting: boolean) {
  const [paintedMonth, setPaintedMonth] = useState<string | null>(null)
  const [paintedArrived, setPaintedArrived] = useState(false) // shown by the new month, not opened from a view
  useEffect(() => {
    if (waiting || !Object.keys(days).length) return
    const now = todayIso().slice(0, 7)
    const last =
      now.endsWith('-01') || tryYear
        ? String(Number(now.slice(0, 4)) - 1)
        : (monthsAgo(`${now}-01`, 1) ?? '').slice(0, 7)
    let seen: string | null = null
    try {
      seen = localStorage.getItem(PAINTED_KEY)
    } catch {
      /* storage unavailable: it may show again, which is harmless */
    }
    if (!tryMonth && !tryYear && seen === now) return
    if (!Object.keys(days).some((iso) => iso.startsWith(last))) return
    setPaintedMonth(last)
    setPaintedArrived(true)
    try {
      localStorage.setItem(PAINTED_KEY, now)
    } catch {
      /* fine */
    }
  }, [waiting, days])
  /** Open a painting from its icon (not the new month's arrival). */
  const openPainting = (p: string) => {
    setPaintedArrived(false)
    setPaintedMonth(p)
  }
  return { paintedMonth, paintedArrived, openPainting, closePainting: () => setPaintedMonth(null) }
}
