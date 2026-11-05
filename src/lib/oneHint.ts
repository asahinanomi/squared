import { useEffect, useState } from 'react'

// One hint at a time (nomi, Nov 5, 2026: the list's filter and a month's painting bubbles came together): whichever is
// due first takes the moment; any other that wants to show meanwhile skips this time, quietly. Each comes back on a
// later visit until it has done its job, so nothing is lost.
let active: string | null = null

/** `on` while this hint wants to show; true only while it has the moment. */
export function useOneHint(id: string, on: boolean) {
  const [mine, setMine] = useState(false)
  useEffect(() => {
    if (!on) {
      if (active === id) active = null
      setMine(false)
      return
    }
    if (active && active !== id) return setMine(false) // another hint is showing: skip this time
    active = id
    setMine(true)
  }, [on]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(
    () => () => {
      if (active === id) active = null
    },
    [], // eslint-disable-line react-hooks/exhaustive-deps
  )
  return on && mine
}
