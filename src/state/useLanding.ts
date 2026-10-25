import { useEffect, useState } from 'react'
import { todayIso } from '../lib/dates'
import type { Account } from './useAccount'
import type { Navigation } from './useNavigation'
/** Where you land, decided once when the days are in: home when today is painted, otherwise today, ready for a
 *  moment (there's no onboarding: how many squares and what matters are set up later, from my days). Nothing shows
 *  until then (no flash of today before home); if loading drags past 4s, today it is. */
export function useLanding(signedIn: boolean, acc: Account, nav: Navigation) {
  const { daysReady, profileReady, days } = acc
  const { screen, setScreenValue, date } = nav
  const [landed, setLanded] = useState(false)
  useEffect(() => {
    if (landed || !signedIn) return
    if (!daysReady || !profileReady) {
      const t = setTimeout(() => setLanded(true), 4000)
      return () => clearTimeout(t)
    }
    if (screen === 'today' && date === todayIso() && days[todayIso()]) setScreenValue('home')
    setLanded(true)
  }, [signedIn, daysReady, profileReady, landed]) // eslint-disable-line react-hooks/exhaustive-deps
  return landed
}
