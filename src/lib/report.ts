import { supabase } from './supabase'

// Why a save failed, written down so it can be fixed at the root (not guessed at). Each failure becomes one short
// line: kept on this device first (a failing network can't log), then sent to the account's client_errors table
// (migration 0015) whenever it can be.

const KEY = 'squared.errors'
const MAX = 50

type Line = {
  happened_at: string
  what: string
  code: string | null
  message: string | null
  status: number | null
  ms: number | null
  online: boolean
  since_visible_ms: number | null
  agent: string
}

// When the app last came back to the screen: a failure just after waking points at the phone, not the code.
let visibleAt = Date.now()
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') visibleAt = Date.now()
})

const read = (): Line[] => {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) ?? '[]')
    return Array.isArray(v) ? v : []
  } catch {
    return []
  }
}
const write = (lines: Line[]) => {
  try {
    localStorage.setItem(KEY, JSON.stringify(lines.slice(-MAX)))
  } catch {
    /* full or private: the line is lost, the save itself is not */
  }
}

/** Write down why something failed. `ms`: how long it ran before failing. */
export function reportError(what: string, e: unknown, ms?: number) {
  const err = (e ?? {}) as { code?: unknown; message?: unknown; status?: unknown; name?: unknown }
  write([
    ...read(),
    {
      happened_at: new Date().toISOString(),
      what,
      code: err.code ? String(err.code) : err.name ? String(err.name) : null,
      message: err.message ? String(err.message).slice(0, 300) : String(e).slice(0, 300),
      status: typeof err.status === 'number' ? err.status : null,
      ms: ms === undefined ? null : Math.round(ms),
      online: navigator.onLine,
      since_visible_ms: document.visibilityState === 'visible' ? Date.now() - visibleAt : null,
      agent: navigator.userAgent.slice(0, 160),
    },
  ])
  void sendErrors()
}

let sending = false
/** Send what's written down to the account; what can't go yet stays for next time. */
export async function sendErrors() {
  if (!supabase || sending) return
  const lines = read()
  if (!lines.length) return
  sending = true
  try {
    const { error } = await supabase.from('client_errors').insert(lines)
    if (!error) write(read().slice(lines.length))
  } catch {
    /* next time */
  } finally {
    sending = false
  }
}
