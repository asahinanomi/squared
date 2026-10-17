import { supabase } from './supabase'

// "what matters": the owner's own compass — what a meaningful day and an empty day look like to them.
// A reference only: it never scores or colours a day. Kept in the account (migration 0007) so every
// device sees the same lists, with a copy on this device so it opens at once, and offline.

export type Entry = { id: string; text: string }
export type Matters = { meaningful: Entry[]; empty: Entry[] }
export type Kind = keyof Matters
/** The lists, and when they were last changed (absent on a copy saved before sync existed). */
export type Saved = Matters & { at?: string }

const KEY = 'squared.matters'
export const MAX_CHARS = 120 // a line or two

// Never keep blank entries.
const clean = (m: Matters): Matters => {
  const keep = (l: Entry[]) => l.filter((e) => e.text.trim())
  return { meaningful: keep(m.meaningful), empty: keep(m.empty) }
}

/** This device's copy. */
export function loadMatters(): Saved {
  try {
    const m = JSON.parse(localStorage.getItem(KEY) ?? 'null') as Saved | null
    if (m && Array.isArray(m.meaningful) && Array.isArray(m.empty)) return m
  } catch {
    /* unreadable or unavailable: start fresh */
  }
  return { meaningful: [], empty: [] }
}

function keepLocal(m: Saved) {
  try {
    localStorage.setItem(KEY, JSON.stringify(m))
  } catch {
    /* storage unavailable (private mode): the lists last until the app closes */
  }
}

/** The account's copy: null when there's none yet, or no account to keep it in (demo, or 0007 not run). */
export async function fetchMatters(): Promise<Saved | null> {
  if (!supabase) return null
  const { data, error } = await supabase.from('matters').select('meaningful, empty, saved_at').maybeSingle()
  if (error?.code === 'PGRST205' || error?.code === '42P01') return null
  if (error) throw error
  return data && { meaningful: data.meaningful, empty: data.empty, at: data.saved_at }
}

/** Save a change on this device (at once, on every change). */
export function saveMatters(m: Matters): Saved {
  const saved = { ...clean(m), at: new Date().toISOString() }
  keepLocal(saved)
  return saved
}

/** Send this device's copy to the account. */
export async function pushMatters(m: Saved): Promise<void> {
  if (!supabase) return
  const { error } = await supabase
    .from('matters')
    .upsert({ meaningful: m.meaningful, empty: m.empty, saved_at: m.at }, { onConflict: 'user_id' })
  if (error && error.code !== 'PGRST205' && error.code !== '42P01') throw error
}

/** Opening the lists: whichever copy changed last wins, and the other side catches up. */
export async function syncMatters(local: Saved): Promise<Saved> {
  const remote = await fetchMatters()
  const hasLocal = local.meaningful.length + local.empty.length > 0
  // The account writes its times its own way ("…+00:00"), so compare them as times, not text.
  if (remote && (!local.at || Date.parse(remote.at!) >= Date.parse(local.at))) {
    keepLocal(remote)
    return remote
  }
  // This device is newer (or the account has nothing yet): send it up.
  if (remote || hasLocal) await pushMatters({ ...local, at: local.at ?? new Date().toISOString() })
  return local
}

export const newEntry = (): Entry => ({ id: crypto.randomUUID(), text: '' })
