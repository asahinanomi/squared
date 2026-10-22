import { commit } from './save'
import { supabase } from './supabase'

// "what matters": the owner's own compass — what a meaningful day and a wasted day look like to them.
// A reference only: it never scores or colours a day. It lives in the account only, one row per line (migration
// 0017), so every device shows the same lists and edits made on two devices add up instead of overwriting.
// Every change (a line added, edited, deleted, or the order) saves straight to the account.

export type Entry = { id: string; text: string }
export type Matters = { meaningful: Entry[]; wasted: Entry[] }
export type Kind = keyof Matters

export const MAX_CHARS = 120 // a line or two
export const noMatters = (): Matters => ({ meaningful: [], wasted: [] })
export const newEntry = (): Entry => ({ id: crypto.randomUUID(), text: '' })
export const written = (m: Matters) => m.meaningful.length > 0 || m.wasted.length > 0

// The demo (no account) keeps its lists on the device.
const DEMO = 'squared.matters.demo'
const KINDS: Kind[] = ['meaningful', 'wasted']

// Never keep blank lines.
const clean = (m: Matters): Matters => {
  const keep = (l: Entry[]) => l.filter((e) => e.text.trim())
  return { meaningful: keep(m.meaningful), wasted: keep(m.wasted) }
}

const missing = (code?: string) => code === 'PGRST205' || code === '42P01'
// Lines can only be saved once migration 0017 has made their table; until then a save says "not saved" (it's never
// dropped quietly) and the old lists are read only.
let entriesReady = false

/** The account's lists. Before 0017 is run, the old single row is read (read only). */
export async function fetchMatters(): Promise<Matters> {
  if (!supabase) {
    try {
      return { ...noMatters(), ...JSON.parse(localStorage.getItem(DEMO) ?? 'null') }
    } catch {
      return noMatters()
    }
  }
  const { data, error } = await supabase.from('matters_entries').select('id, kind, text, position').order('position')
  if (missing(error?.code)) {
    entriesReady = false
    const old = await supabase.from('matters').select('*').maybeSingle()
    if (missing(old.error?.code)) return noMatters()
    if (old.error) throw old.error
    return old.data
      ? { meaningful: old.data.meaningful ?? [], wasted: old.data.wasted ?? old.data.empty ?? [] }
      : noMatters()
  }
  if (error) throw error
  entriesReady = true
  const out = noMatters()
  for (const r of data ?? []) if (r.kind in out) out[r.kind as Kind].push({ id: r.id, text: r.text })
  return out
}

/**
 * Save what changed between what the account has (`base`) and the lists now (`next`): each line added, edited
 * or deleted on its own, and the order when it moved. Only what changed is sent, so another device's lines stay.
 */
export function saveMatters(base: Matters, next: Matters) {
  const now = clean(next)
  if (!supabase) {
    try {
      localStorage.setItem(DEMO, JSON.stringify(now))
    } catch {
      /* the demo lasts until the app closes */
    }
    return
  }
  const sb = supabase
  if (!entriesReady) {
    commit('matters', async () => {
      throw Object.assign(new Error('what matters cannot be saved until migration 0017 is run'), { code: 'not-ready' })
    })
    return
  }
  for (const kind of KINDS) {
    const was = new Map(base[kind].map((e) => [e.id, e]))
    const is = new Map(now[kind].map((e) => [e.id, e]))
    for (const e of base[kind])
      if (!is.has(e.id))
        commit('matters-del', async () => {
          const { error } = await sb.from('matters_entries').delete().eq('id', e.id)
          if (error) throw error
        })
    // Moved: the lines both sides have are in a different order (new lines alone don't count).
    const moved =
      now[kind]
        .filter((e) => was.has(e.id))
        .map((e) => e.id)
        .join() !==
      base[kind]
        .filter((e) => is.has(e.id))
        .map((e) => e.id)
        .join()
    const rows = now[kind]
      .map((e, i) => ({ e, i }))
      .filter(({ e }) => moved || !was.has(e.id) || was.get(e.id)!.text !== e.text)
      .map(({ e, i }) => ({ id: e.id, kind, text: e.text, position: i, updated_at: new Date().toISOString() }))
    if (rows.length)
      commit('matters', async () => {
        const { error } = await sb.from('matters_entries').upsert(rows, { onConflict: 'user_id,id' })
        if (error) throw error
      })
  }
}

// Before lists lived in the account only, each device kept a copy, which could hold lines the account never got.
// The first time this version opens, a copy that's this account's (or from before copies had an owner) adds its
// missing lines to the account, then it's gone from the device.
export async function adoptDeviceCopy(user: string, account: Matters): Promise<Matters> {
  if (!entriesReady) return account // the copy stays on the device until its lines can be saved
  let copy: (Matters & { owner?: string; empty?: Entry[] }) | null = null
  try {
    copy = JSON.parse(localStorage.getItem('squared.matters') ?? 'null')
    localStorage.removeItem('squared.matters')
    localStorage.removeItem('squared.matters.prev')
  } catch {
    return account
  }
  if (!copy || (copy.owner && copy.owner !== user)) return account
  const add = (kind: Kind, lines: Entry[] | undefined) => {
    const have = new Set(account[kind].map((e) => e.text.trim().toLowerCase()))
    const ids = new Set(account[kind].map((e) => e.id))
    return (lines ?? []).filter((e) => e?.text?.trim() && !ids.has(e.id) && !have.has(e.text.trim().toLowerCase()))
  }
  const extra = { meaningful: add('meaningful', copy.meaningful), wasted: add('wasted', copy.wasted ?? copy.empty) }
  if (!written(extra)) return account
  const next = {
    meaningful: [...account.meaningful, ...extra.meaningful],
    wasted: [...account.wasted, ...extra.wasted],
  }
  saveMatters(account, next)
  return next
}
