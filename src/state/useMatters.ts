import { useCallback, useEffect, useState } from 'react'
import { fetchMatters, noMatters, saveMatters, written, type Matters } from '../lib/matters'
import { demo, type Screen } from './app'

/** What matters, from the account: fresh when home opens, and whenever the app comes back to the screen. */
export function useMatters(userId: string | undefined, screen: Screen) {
  const [matters, setMatters] = useState<Matters>(noMatters)
  const refresh = useCallback(() => {
    if (!userId && !demo) return
    fetchMatters()
      .then(setMatters)
      .catch((e) => console.error('Could not load what matters', e))
  }, [userId])
  useEffect(refresh, [refresh])
  useEffect(() => {
    if (screen === 'home') refresh()
  }, [screen]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    const back = () => document.visibilityState === 'visible' && refresh()
    document.addEventListener('visibilitychange', back)
    return () => document.removeEventListener('visibilitychange', back)
  }, [refresh])
  /** Lines written in onboarding: saved to the account. */
  const addLines = (m: Matters) => {
    saveMatters(matters, m)
    setMatters(m)
  }
  return { matters, setMatters, addLines, mattersWritten: written(matters) }
}
