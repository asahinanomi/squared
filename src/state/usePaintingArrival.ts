import { useEffect, useRef, useState } from 'react'
import { monthsAgo, todayIso } from '../lib/dates'
import type { Days } from '../lib/days'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import { tryMonth, tryYear } from './app'

const PAINTED_KEY = 'squared.paintedMonth' // the month whose arrival last showed a painting (January: the year's)

/** The painting that's open, if any. A new month shows the last one once, as a painting (a new year: the whole last
 *  year); any month or year opens again from its picture icon. */
// Remembered with the account (nomi, Nov 5, 2026: it showed again in each place squared was opened, since a phone's
// home screen app, Safari, another device each keep their own storage), and on the device too.
export function usePaintingArrival(days: Days, waiting: boolean, session?: Session | null) {
  const [paintedMonth, setPaintedMonth] = useState<string | null>(null)
  const [paintedArrived, setPaintedArrived] = useState(false) // shown by the new month, not opened from a view
  // Decided once, as squared opens (for each person signed in), never again as days are painted: painting a past day
  // of last month mid-month brought "a new month. here's the last one." up over the square's answer (nomi, Nov 5,
  // 2026, as a new user). Last month with no days when squared opens: no painting until next month.
  const decidedFor = useRef<string | null>(null)
  useEffect(() => {
    const who = session?.user.id ?? 'demo'
    if (waiting || decidedFor.current === who) return
    decidedFor.current = who
    const now = todayIso().slice(0, 7)
    const last =
      now.endsWith('-01') || tryYear
        ? String(Number(now.slice(0, 4)) - 1)
        : (monthsAgo(`${now}-01`, 1) ?? '').slice(0, 7)
    // Per person on the device too: someone else signing in here still sees theirs.
    const key = `${PAINTED_KEY}.${session?.user.id ?? 'demo'}`
    let seen: string | null = session?.user.user_metadata?.painted_month ?? null
    try {
      if (seen !== now) seen = localStorage.getItem(key)
    } catch {
      /* storage unavailable: the account still knows */
    }
    if (!tryMonth && !tryYear && seen === now) return
    if (!Object.keys(days).some((iso) => iso.startsWith(last))) return
    setPaintedMonth(last)
    setPaintedArrived(true)
    try {
      localStorage.setItem(key, now)
    } catch {
      /* fine */
    }
    if (supabase && session && !tryMonth && !tryYear)
      supabase.auth.updateUser({ data: { painted_month: now } }).catch(() => undefined)
  }, [waiting, days]) // eslint-disable-line react-hooks/exhaustive-deps
  /** Open a painting from its icon (not the new month's arrival). */
  const openPainting = (p: string) => {
    setPaintedArrived(false)
    setPaintedMonth(p)
  }
  return { paintedMonth, paintedArrived, openPainting, closePainting: () => setPaintedMonth(null) }
}
