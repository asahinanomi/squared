import { todayIso, paintedFresh } from './dates'
import { saveColor, saveFramed, wipeDay, type Days } from './days'
import { addNote, deleteNote, replaceNote, setPinned, type Note, type Notes } from './notes'
import type { Paint } from './paints'
import { reportError, sendErrors } from './report'
import { supabase } from './supabase'

// Every change lands on this device first, then goes to the account. Painting, framing, wiping and notes go into
// this outbox (kept in localStorage, so a closed app or a dead connection loses nothing) and are sent in order. A
// failed send waits and tries again: when the connection comes back, when the app comes back to the screen, and
// every little while. Until it's sent, the change is laid over whatever the account loads, so it never seems to
// vanish. Two changes to the same thing before it's sent become one (the latest).

export type Op =
  | { k: 'color'; date: string; color: Paint }
  | { k: 'wipe'; date: string }
  | { k: 'framed'; date: string; framed: boolean }
  | { k: 'note-add'; note: Note }
  | { k: 'note-body'; note: Note; body: string }
  | { k: 'note-pin'; note: Note; pinned: boolean }
  | { k: 'note-del'; note: Note }

type Item = { op: Op; user: string; at: number; tries: number }

const KEY = 'squared.outbox'
const read = (): Item[] => {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) ?? '[]')
    return Array.isArray(v) ? v : []
  } catch {
    return []
  }
}
let items: Item[] = read()
const persist = () => {
  try {
    localStorage.setItem(KEY, JSON.stringify(items))
  } catch {
    /* storage full or private: it still sends from memory */
  }
  notify()
}

let user: string | null = null
const mine = () => items.filter((i) => i.user === user)

// The state of the outbox, for the quiet "saved on this phone" line and, if it stays stuck, the bubble.
export type SyncState = { pending: number; since: number | null; stuck: boolean }
const listeners = new Set<(s: SyncState) => void>()
export function syncState(): SyncState {
  const list = mine()
  const since = list.length ? Math.min(...list.map((i) => i.at)) : null
  return { pending: list.length, since, stuck: list.some((i) => i.tries >= 2) }
}
const notify = () => listeners.forEach((f) => f(syncState()))
export function onSync(f: (s: SyncState) => void) {
  listeners.add(f)
  return () => void listeners.delete(f)
}

const dateOf = (op: Op) => ('date' in op ? op.date : op.note.date)
const noteId = (op: Op) => ('note' in op ? op.note.id : null)

/** Queue a change for the account (it's already on screen) and start sending. */
export function enqueue(op: Op) {
  if (!supabase || !user) return
  const at = Date.now()
  const same = (i: Item) => i.user === user
  // A day's colour (or its wipe) is one thing: the latest wins, in its place in line.
  if (op.k === 'color' || op.k === 'wipe') {
    const i = items.findIndex((x) => same(x) && (x.op.k === 'color' || x.op.k === 'wipe') && dateOf(x.op) === op.date)
    if (i >= 0) items[i] = { ...items[i], op }
    else items.push({ op, user: user!, at, tries: 0 })
  } else if (op.k === 'framed') {
    const i = items.findIndex((x) => same(x) && x.op.k === 'framed' && dateOf(x.op) === op.date)
    if (i >= 0) items[i] = { ...items[i], op }
    else items.push({ op, user: user!, at, tries: 0 })
  } else {
    const id = op.note.id
    const add = items.findIndex((x) => same(x) && x.op.k === 'note-add' && noteId(x.op) === id)
    if (add >= 0 && op.k !== 'note-add') {
      // Not sent yet: change the note that's waiting to be added (or, deleted, never send it).
      const waiting = items[add].op as { k: 'note-add'; note: Note }
      if (op.k === 'note-del') items = items.filter((x, n) => n !== add && !(same(x) && noteId(x.op) === id))
      else
        items[add] = {
          ...items[add],
          op: {
            k: 'note-add',
            note:
              op.k === 'note-body'
                ? { ...waiting.note, body: op.body, writtenAt: new Date().toISOString() }
                : { ...waiting.note, pinned: op.pinned || undefined },
          },
        }
    } else {
      if (op.k === 'note-del') items = items.filter((x) => !(same(x) && noteId(x.op) === id))
      const i = items.findIndex((x) => same(x) && x.op.k === op.k && noteId(x.op) === id)
      if (i >= 0 && op.k !== 'note-del') items[i] = { ...items[i], op }
      else items.push({ op, user: user!, at, tries: 0 })
    }
  }
  persist()
  void flush()
}

async function send(op: Op) {
  switch (op.k) {
    case 'color':
      return saveColor(op.date, op.color)
    case 'wipe':
      return wipeDay(op.date)
    case 'framed':
      return saveFramed(op.date, op.framed)
    case 'note-add':
      return addNote(op.note)
    case 'note-body':
      return replaceNote(op.note, op.body)
    case 'note-pin':
      return setPinned(op.note, op.pinned)
    case 'note-del':
      return deleteNote(op.note)
  }
}

/** A refusal that trying again can't fix (a database rule or a missing column): written down, then let go. */
const hopeless = (e: unknown) => {
  const code = String((e as { code?: unknown })?.code ?? '')
  return /^(22|23|42)/.test(code) || code === 'PGRST116' || code === 'PGRST204' || code === 'PGRST205'
}

let running = false
let timer: ReturnType<typeof setTimeout> | undefined
/** Send what's waiting, oldest first; stop at the first failure and try again later. */
export async function flush() {
  if (!supabase || !user || running) return
  running = true
  clearTimeout(timer)
  try {
    for (;;) {
      const next = items.find((i) => i.user === user)
      if (!next) break
      const t0 = performance.now()
      try {
        await send(next.op)
        items = items.filter((i) => i !== next)
        persist()
      } catch (e) {
        reportError(`save ${next.op.k}`, e, performance.now() - t0)
        if (hopeless(e)) {
          items = items.filter((i) => i !== next)
          persist()
          continue
        }
        next.tries++
        persist()
        // Again in a little while: 4s, 8s, 16s… up to a minute.
        timer = setTimeout(() => void flush(), Math.min(60_000, 2000 * 2 ** next.tries))
        break
      }
    }
  } finally {
    running = false
  }
  void sendErrors()
}

/** Who's signed in: only their changes are sent (a shared phone never mixes accounts). */
export function setOutboxUser(id: string | null) {
  user = id
  notify()
  void flush()
}

// The moments a stuck send might go through: the connection is back, or the app is.
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => void flush())
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') void flush()
  })
}

/** The account's days, with this device's unsent changes laid over them. */
export function overlayDays(days: Days): Days {
  const out = { ...days }
  for (const { op } of mine()) {
    if (op.k === 'color') {
      const d = out[op.date]
      out[op.date] = d
        ? { ...d, color: op.color, framed: op.color === 'green' ? d.framed : undefined }
        : { backfilled: !paintedFresh(op.date), paintedOn: todayIso(), color: op.color }
    } else if (op.k === 'wipe') delete out[op.date]
    else if (op.k === 'framed' && out[op.date]) out[op.date] = { ...out[op.date], framed: op.framed }
  }
  return out
}

/** The account's notes (for the days loaded, if `only` says which), with this device's unsent changes over them. */
export function overlayNotes(notes: Notes, only?: (date: string) => boolean): Notes {
  const out: Notes = { ...notes }
  const put = (date: string, fn: (l: Note[]) => Note[]) => {
    out[date] = fn(out[date] ?? []).sort((a, b) => a.writtenAt.localeCompare(b.writtenAt))
  }
  for (const { op } of mine()) {
    if (!('note' in op) || (only && !only(op.note.date))) continue
    const id = op.note.id
    if (op.k === 'note-add') put(op.note.date, (l) => [...l.filter((n) => n.id !== id), op.note])
    else if (op.k === 'note-body') put(op.note.date, (l) => l.map((n) => (n.id === id ? { ...n, body: op.body } : n)))
    else if (op.k === 'note-pin')
      put(op.note.date, (l) => l.map((n) => (n.id === id ? { ...n, pinned: op.pinned || undefined } : n)))
    else put(op.note.date, (l) => l.filter((n) => n.id !== id))
  }
  return out
}
