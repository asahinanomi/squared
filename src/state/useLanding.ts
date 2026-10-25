import { useEffect, useState } from 'react'
import type { Account } from './useAccount'

/** Where you land: today, always (there's no onboarding, and no home: how many squares and what matters are set up
 *  later, from my days). Nothing shows until the days are in; if loading drags past 4s, today it is. */
export function useLanding(signedIn: boolean, acc: Account) {
  const { daysReady, profileReady } = acc
  const [landed, setLanded] = useState(false)
  useEffect(() => {
    if (landed || !signedIn) return
    if (!daysReady || !profileReady) {
      const t = setTimeout(() => setLanded(true), 4000)
      return () => clearTimeout(t)
    }
    setLanded(true)
  }, [signedIn, daysReady, profileReady, landed])
  return landed
}
