import { supabase } from './supabase'

// "what matters": the owner's own compass — what a meaningful day and a wasted day look like to them.
// A reference only: it never scores or colours a day. Kept in the account (migration 0007) so every
// device sees the same lists, with a copy on this device so it opens at once, and offline.

export type Entry = { id: string; text: string }
export type Matters = { meaningful: Entry[]; wasted: Entry[] }
export type Kind = keyof Matters
/** The lists, and when they were last changed (absent on a copy saved before sync existed). */
export type Saved = Matters & { at?: string }

const KEY = 'squared.matters'
export const MAX_CHARS = 120 // a line or two

// Never keep blank entries.
const clean = (m: Matters): Matters => {
  const keep = (l: Entry[]) => l.filter((e) => e.text.trim())
  return { meaningful: keep(m.meaningful), wasted: keep(m.wasted) }
}

/** This device's copy. */
export function loadMatters(): Saved {
  try {
    // Copies saved before the rename keep the second list as "empty".
    const m = JSON.parse(localStorage.getItem(KEY) ?? 'null') as (Saved & { empty?: Entry[] }) | null
    const wasted = m?.wasted ?? m?.empty
    if (m && Array.isArray(m.meaningful) && Array.isArray(wasted)) return { meaningful: m.meaningful, wasted, at: m.at }
  } catch {
    /* unreadable or unavailable: start fresh */
  }
  return { meaningful: [], wasted: [] }
}

function keepLocal(m: Saved) {
  try {
    localStorage.setItem(KEY, JSON.stringify(m))
  } catch {
    /* storage unavailable (private mode): the lists last until the app closes */
  }
}

// The second list's column was "empty" until migration 0008 renamed it; read either, so the app and
// the migration can land in any order.
const missingColumn = (code?: string) => code === '42703' || code === 'PGRST204'

/** The account's copy: null when there's none yet, or no account to keep it in (demo, or 0007 not run). */
async function fetchMatters(): Promise<Saved | null> {
  if (!supabase) return null
  const { data, error } = await supabase.from('matters').select('*').maybeSingle()
  if (error?.code === 'PGRST205' || error?.code === '42P01') return null
  if (error) throw error
  return data && { meaningful: data.meaningful, wasted: data.wasted ?? data.empty, at: data.saved_at }
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
  const send = (second: 'wasted' | 'empty') =>
    supabase!
      .from('matters')
      .upsert({ meaningful: m.meaningful, [second]: m.wasted, saved_at: m.at }, { onConflict: 'user_id' })
  let { error } = await send('wasted')
  if (missingColumn(error?.code)) ({ error } = await send('empty')) // 0008 not run yet
  if (error && error.code !== 'PGRST205' && error.code !== '42P01') throw error
}

/** Opening the lists: whichever copy changed last wins, and the other side catches up. */
export async function syncMatters(local: Saved): Promise<Saved> {
  const remote = await fetchMatters()
  const hasLocal = local.meaningful.length + local.wasted.length > 0
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
