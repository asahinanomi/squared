import { useEffect, useState } from 'react'

/**
 * A hint that fades out instead of vanishing (nomi, Nov 5, 2026: gone at once, it felt like something was wrong):
 * while `on`, it's shown; once off, it stays a moment longer, `leaving`, to fade (LEAVE_MS, as `.is-leaving` in CSS).
 */
export const LEAVE_MS = 700
export function useLeaving(on: boolean) {
  const [shown, setShown] = useState(on)
  const [leaving, setLeaving] = useState(false)
  useEffect(() => {
    if (on) {
      setShown(true)
      setLeaving(false)
      return
    }
    if (!shown) return
    setLeaving(true)
    const t = setTimeout(() => {
      setShown(false)
      setLeaving(false)
    }, LEAVE_MS)
    return () => clearTimeout(t)
  }, [on]) // eslint-disable-line react-hooks/exhaustive-deps
  return { shown, leaving }
}
