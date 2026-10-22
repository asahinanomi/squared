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
const PREV = 'squared.matters.prev' // the copy a sync last replaced, just in case

// Whose lists this device holds. A device can be shared (or used to try a new account): one account's copy must
// never be sent up into another's. Copies saved before this carry no owner.
let owner: string | null = null
type Stored = Saved & { owner?: string; empty?: Entry[] }
const readStored = (): Stored | null => {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? 'null')
  } catch {
    return null
  }
}
/** Signed in (or out): from now on this device's copy belongs to `id`; another account's copy is set aside. */
export function setMattersOwner(id: string | null) {
  owner = id
  const m = readStored()
  if (id && m?.owner && m.owner !== id) {
    try {
      localStorage.removeItem(KEY)
    } catch {
      /* fine */
    }
  }
}
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
    const m = readStored()
    if (m?.owner && owner && m.owner !== owner) return { meaningful: [], wasted: [] }
    const wasted = m?.wasted ?? m?.empty
    if (m && Array.isArray(m.meaningful) && Array.isArray(wasted)) return { meaningful: m.meaningful, wasted, at: m.at }
  } catch {
    /* unreadable or unavailable: start fresh */
  }
  return { meaningful: [], wasted: [] }
}

function keepLocal(m: Saved) {
  try {
    localStorage.setItem(KEY, JSON.stringify({ ...m, owner: owner ?? undefined }))
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
  // Never send another account's copy (a device used by two accounts).
  const stored = readStored()
  if (stored?.owner && owner && stored.owner !== owner) return
  const send = (second: 'wasted' | 'empty') =>
    supabase!
      .from('matters')
      .upsert({ meaningful: m.meaningful, [second]: m.wasted, saved_at: m.at }, { onConflict: 'user_id' })
  let { error } = await send('wasted')
  if (missingColumn(error?.code)) ({ error } = await send('empty')) // 0008 not run yet
  if (error && error.code !== 'PGRST205' && error.code !== '42P01') throw error
}

const count = (m: Matters) => m.meaningful.length + m.wasted.length
const same = (a: Matters, b: Matters) =>
  JSON.stringify([a.meaningful.map((e) => e.text), a.wasted.map((e) => e.text)]) ===
  JSON.stringify([b.meaningful.map((e) => e.text), b.wasted.map((e) => e.text)])
// Both lists, every entry once (by id, then by its words): nothing on either side is dropped.
const union = (a: Matters, b: Matters): Matters => {
  const join = (x: Entry[], y: Entry[]) => {
    const seen = new Set(x.map((e) => e.id))
    const words = new Set(x.map((e) => e.text.trim().toLowerCase()))
    return [...x, ...y.filter((e) => !seen.has(e.id) && !words.has(e.text.trim().toLowerCase()))]
  }
  return { meaningful: join(a.meaningful, b.meaningful), wasted: join(a.wasted, b.wasted) }
}
const stash = (m: Saved) => {
  try {
    localStorage.setItem(PREV, JSON.stringify({ ...m, owner: owner ?? undefined }))
  } catch {
    /* fine */
  }
}

/** Opening the lists: whichever copy changed last wins, and the other side catches up, with three guards so a
 *  list is never lost: an empty copy never replaces a written one; a copy from before owners existed is merged
 *  in, not dropped; and whatever a sync replaces is kept aside on the device (and in the account's history). */
export async function syncMatters(local: Saved): Promise<Saved> {
  const remote = await fetchMatters()
  const stored = readStored()
  const legacy = !!stored && !stored.owner && count(local) > 0
  // Nothing in the account yet: this device's copy goes up (only if it's this account's).
  if (!remote || count(remote) === 0) {
    if (count(local) > 0) {
      const up = { ...local, at: local.at ?? new Date().toISOString() }
      await pushMatters(up)
      keepLocal(up)
    }
    return local
  }
  if (count(local) === 0 || same(local, remote)) {
    keepLocal(remote)
    return remote
  }
  // An older device copy (from before owners): merge it in, so nothing written on it is lost.
  if (legacy) {
    const merged = { ...union(remote, local), at: new Date().toISOString() }
    stash(local)
    await pushMatters(merged)
    keepLocal(merged)
    return merged
  }
  // The account's copy is newer: it wins; this device's is kept aside.
  if (!local.at || Date.parse(remote.at!) >= Date.parse(local.at)) {
    stash(local)
    keepLocal(remote)
    return remote
  }
  // This device is newer: send it up.
  await pushMatters({ ...local, at: local.at })
  keepLocal(local)
  return local
}

export const newEntry = (): Entry => ({ id: crypto.randomUUID(), text: '' })
