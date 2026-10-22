import { useEffect, useState } from 'react'
import { discardSaves, onSave, retrySaves, saveState, type SaveState } from '../lib/save'

const QUIET_AFTER = 3000 // a normal save is done well before this: the line shows only when one is slow

// Where your changes are. Usually nowhere to be seen: they're in the account in a moment. If one is slow, a quiet
// "saving…" under the top bar. If it can't get through, an ink speech bubble says so plainly (never red: red is a
// paint): the change is on screen but not saved, until "try again" sends it or "discard" goes back to the account.
export function SyncStatus() {
  const [s, setS] = useState<SaveState>(saveState)
  const [now, setNow] = useState(Date.now)
  useEffect(() => onSave(setS), [])
  useEffect(() => {
    if (!s.saving) return
    const t = setInterval(() => setNow(Date.now()), 500)
    return () => clearInterval(t)
  }, [s.saving])
  if (s.failed)
    return (
      <div className="sync-bubble" role="alert">
        <p>Not saved. squared couldn't reach your account. Check your connection.</p>
        <span className="sync-actions">
          <button onClick={retrySaves}>try again</button>
          <button onClick={discardSaves}>discard</button>
        </span>
      </div>
    )
  if (!s.saving || s.since === null || now - s.since < QUIET_AFTER) return null
  return (
    <p className="sync-quiet" role="status">
      saving…
    </p>
  )
}
