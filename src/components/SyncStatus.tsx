import { useEffect, useState } from 'react'
import { flush, onSync, syncState, type SyncState } from '../lib/outbox'

const QUIET_AFTER = 4000 // a normal save is gone well before this: the line shows only when one is slow

// Where your changes are. Usually nowhere to be seen: they reach the account in a moment. If one is slow, a quiet
// line under the top bar says it's "saved on this phone". If sending keeps failing, an ink speech bubble says so
// plainly (never red: red is a paint), with a way to try now.
export function SyncStatus() {
  const [s, setS] = useState<SyncState>(syncState)
  const [now, setNow] = useState(Date.now)
  useEffect(() => onSync(setS), [])
  useEffect(() => {
    if (!s.pending) return
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [s.pending])
  if (!s.pending || s.since === null) return null
  if (s.stuck)
    return (
      <div className="sync-bubble" role="status">
        <p>Not synced yet. Your changes are safe on this phone, and I'll keep trying.</p>
        <button onClick={() => void flush()}>try now</button>
      </div>
    )
  if (now - s.since < QUIET_AFTER) return null
  return (
    <p className="sync-quiet" role="status">
      saved on this phone
    </p>
  )
}
