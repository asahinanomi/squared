import { useEffect, useRef } from 'react'
import type { Screen } from './app'
import type { Navigation } from './useNavigation'

/** The browser's back button: each move to another screen is a step in the browser's history, so back returns to
 *  where you were (paging day to day on today's screen only updates the step, never piles them up). */
export function useBrowserHistory(signedIn: boolean, nav: Navigation, onBack: () => void) {
  const { screen, date, setScreenValue, setDate } = nav
  const fromHistory = useRef(false)
  const where = useRef({ screen, date })
  where.current = { screen, date }
  const leaving = useRef(onBack)
  leaving.current = onBack
  useEffect(() => {
    if (!signedIn) return
    if (fromHistory.current) {
      fromHistory.current = false
      return
    }
    const st = { screen, date }
    const cur = history.state as { screen?: Screen; date?: string } | null
    if (!cur?.screen || cur.screen === screen) history.replaceState(st, '')
    else history.pushState(st, '')
  }, [signedIn, screen, date])
  useEffect(() => {
    const back = (e: PopStateEvent) => {
      const st = e.state as { screen?: Screen; date?: string } | null
      if (!st?.screen) return
      const now = where.current
      if (st.screen === now.screen && st.date === now.date) return
      fromHistory.current = true
      leaving.current()
      setScreenValue(st.screen)
      if (st.date) setDate(st.date)
    }
    window.addEventListener('popstate', back)
    return () => window.removeEventListener('popstate', back)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps
}
