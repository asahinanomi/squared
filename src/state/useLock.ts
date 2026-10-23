import { useEffect, useRef } from 'react'
import { awayTooLong, clearAway, markAway, savesSettled } from '../lib/lock'

/** Lock when I leave: signed in, leaving notes the time; coming back (or opening squared fresh) after longer than
 *  you chose signs out, once everything is saved. Signed out, nothing is counted. */
export function useLock(signedIn: boolean, signOut: () => void) {
  const out = useRef(signOut)
  out.current = signOut
  useEffect(() => {
    if (!signedIn) {
      clearAway()
      return
    }
    const check = async () => {
      if (!awayTooLong()) return clearAway()
      if (await savesSettled()) {
        clearAway()
        out.current()
      }
    }
    check() // opened fresh after being away
    const onVis = () => (document.visibilityState === 'hidden' ? markAway() : check())
    document.addEventListener('visibilitychange', onVis)
    window.addEventListener('pagehide', markAway)
    return () => {
      document.removeEventListener('visibilitychange', onVis)
      window.removeEventListener('pagehide', markAway)
    }
  }, [signedIn])
}
