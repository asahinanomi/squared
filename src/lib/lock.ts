import { onSave, saveState } from './save'

// Lock when I leave: a journal locks itself. When squared has been away (another app, the phone locked, closed) longer
// than you chose, it signs out; signing in again with Google is the unlock. "immediately" allows 30 seconds, so a
// quick glance at a message never loses a half-written note. There's no "never". Remembered on the device.

export type LockAfter = 'now' | '15' | '30'
export const LOCK_CHOICES: [LockAfter, string][] = [
  ['now', 'immediately'],
  ['15', '15 min'],
  ['30', '30 min'],
]
const KEY = 'squared.lockAfter'
const AWAY = 'squared.awayAt'
const LIMIT: Record<LockAfter, number> = { now: 30_000, '15': 15 * 60_000, '30': 30 * 60_000 }

export function lockAfter(): LockAfter {
  try {
    const v = localStorage.getItem(KEY)
    return v === '15' || v === '30' ? v : 'now'
  } catch {
    return 'now'
  }
}
export function setLockAfter(v: LockAfter) {
  try {
    localStorage.setItem(KEY, v)
  } catch {
    /* the default stays: immediately */
  }
}

/** Left the app, while signed in: note when. */
export function markAway() {
  try {
    localStorage.setItem(AWAY, String(Date.now()))
  } catch {
    /* without storage, only coming back to the open app can lock */
  }
}
/** Back (or signed out): nothing to count any more. */
export function clearAway() {
  try {
    localStorage.removeItem(AWAY)
  } catch {
    /* nothing kept */
  }
}
/** Away longer than the choice allows? */
export function awayTooLong(): boolean {
  try {
    const at = Number(localStorage.getItem(AWAY))
    return !!at && Date.now() - at > LIMIT[lockAfter()]
  } catch {
    return false
  }
}

/** Resolves true once every change is saved (never sign out over unsaved work); false if a save failed or it takes
 *  longer than 10 seconds: then it stays open, and the lock tries again next time. */
export function savesSettled(): Promise<boolean> {
  const s = saveState()
  if (s.failed) return Promise.resolve(false)
  if (!s.waiting) return Promise.resolve(true)
  return new Promise((done) => {
    const t = setTimeout(() => {
      off()
      done(false)
    }, 10_000)
    const off = onSave((st) => {
      if (st.failed || !st.waiting) {
        clearTimeout(t)
        off()
        done(!st.failed)
      }
    })
  })
}
