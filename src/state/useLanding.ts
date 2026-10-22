import { useEffect, useState } from 'react'
import { todayIso } from '../lib/dates'
import type { Account } from './useAccount'
import type { Navigation } from './useNavigation'
import { legalAtStart, trySquaresAtStart, tryWelcome } from './app'

/** Where you land, decided once when the days and the profile are in: onboarding while your squares aren't set;
 *  home when today is painted, or nothing is painted yet; otherwise today. Nothing shows until then (no flash of
 *  today before home); if loading drags past 4s, today it is. And until the squares are set, onboarding is the only
 *  way in: any other screen leads back to it (the small print stays open to read). */
export function useLanding(signedIn: boolean, acc: Account, nav: Navigation) {
  const { daysReady, profileReady, profile, days } = acc
  const { screen, setScreenValue, date } = nav
  const [landed, setLanded] = useState(false)
  useEffect(() => {
    if (landed || !signedIn) return
    if (!daysReady || !profileReady) {
      const t = setTimeout(() => setLanded(true), 4000)
      return () => clearTimeout(t)
    }
    if (!profile && screen === 'today' && !legalAtStart && !tryWelcome && !trySquaresAtStart) {
      setScreenValue('welcome')
    } else if (screen === 'today' && date === todayIso() && profile && (days[todayIso()] || !Object.keys(days).length))
      setScreenValue('home')
    setLanded(true)
  }, [signedIn, daysReady, profileReady, landed]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!signedIn || !profileReady || profile || tryWelcome || trySquaresAtStart) return
    if (!['welcome', 'privacy', 'terms', 'questions'].includes(screen)) setScreenValue('welcome')
  }, [signedIn, profileReady, profile, screen]) // eslint-disable-line react-hooks/exhaustive-deps
  return landed
}
