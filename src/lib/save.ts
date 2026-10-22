import { paintedFresh, todayIso } from './dates'
import { saveColor, saveFramed, wipeDay, type Days } from './days'
import { addNote, deleteNote, replaceNote, setPinned, type Note, type Notes } from './notes'
import type { Paint } from './paints'
import { reportError, sendErrors } from './report'
import { supabase } from './supabase'

// Saving, online first: every change goes straight to the account, so what you see is what every device sees.
// Nothing is kept on the device to send later. Changes go one at a time, in order; a blip (a phone just woken, a
// dropped request) is tried again a moment later. If it still can't get through, squared says so plainly, keeps
// the change on screen as not saved, and waits: "try again" sends it, "discard" goes back to what the account has.

export type Op =
  | { k: 'color'; date: string; color: Paint }
  | { k: 'wipe'; date: string }
  | { k: 'framed'; date: string; framed: boolean }
  | { k: 'note-add'; note: Note }
  | { k: 'note-body'; note: Note; body: string }
  | { k: 'note-pin'; note: Note; pinned: boolean }
  | { k: 'note-del'; note: Note }

type Job = { what: string; run: () => Promise<unknown> }

export type SaveState = { saving: boolean; since: number | null; failed: boolean; waiting: number }
let queue: Job[] = []
let running = false
let failed = false
let since: number | null = null
const listeners = new Set<(s: SaveState) => void>()
export const saveState = (): SaveState => ({
  saving: queue.length > 0 && !failed,
  since,
  failed,
  waiting: queue.length,
})
const notify = () => listeners.forEach((f) => f(saveState()))
export function onSave(f: (s: SaveState) => void) {
  listeners.add(f)
  return () => void listeners.delete(f)
}

/** A refusal that trying again can't fix (a database rule or a missing column): written down, then let go. */
const hopeless = (e: unknown) => {
  const code = String((e as { code?: unknown })?.code ?? '')
  return /^(22|23|42)/.test(code) || code === 'PGRST116' || code === 'PGRST204' || code === 'PGRST205'
}
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms))

async function pump() {
  if (running || failed) return
  running = true
  try {
    while (queue.length) {
      const job = queue[0]
      const t0 = performance.now()
      let error: unknown = null
      // Twice: a phone just woken often loses its first request.
      for (let attempt = 0; attempt < 2; attempt++) {
        try {
          await job.run()
          error = null
          break
        } catch (e) {
          error = e
          if (hopeless(e)) break
          if (attempt === 0) await wait(1500)
        }
      }
      if (error) {
        reportError(`save ${job.what}`, error, performance.now() - t0)
        if (hopeless(error)) {
          queue.shift() // it can never go through; it's written down
          continue
        }
        failed = true
        notify()
        return
      }
      queue.shift()
      if (!queue.length) since = null
      notify()
    }
  } finally {
    running = false
    void sendErrors()
  }
}

/** Save a change to the account (it's already on screen). */
export function commit(what: string, run: () => Promise<unknown>) {
  if (!supabase) return
  if (!queue.length) since = Date.now()
  queue.push({ what, run })
  notify()
  void pump()
}

/** A day's or a note's change. */
export function save(op: Op) {
  commit(op.k, () => {
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
  })
}

/** "try again": send what's waiting. */
export function retrySaves() {
  failed = false
  since = queue.length ? Date.now() : null
  notify()
  void pump()
}

/** "discard": forget what couldn't be saved; the page reloads what the account has. */
export function discardSaves() {
  queue = []
  failed = false
  since = null
  notify()
  location.reload()
}

/** Still saving or stuck: leaving now would lose it, so the browser asks first. */
export const unsaved = () => queue.length > 0

// The connection is back, or the app is: a stuck save tries again by itself (the message stays until it's in).
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => failed && retrySaves())
  document.addEventListener('visibilitychange', () => document.visibilityState === 'visible' && failed && retrySaves())
  window.addEventListener('beforeunload', (e) => {
    if (unsaved()) e.preventDefault()
  })
}

// Before saving went online-first, changes could wait on a device in an outbox. Whatever is still there for this
// account is taken out once (the outbox is gone after), sent, and laid over what the account loads meanwhile.
const OLD_OUTBOX = 'squared.outbox'
export function takeOldOutbox(user: string): Op[] {
  try {
    const items = JSON.parse(localStorage.getItem(OLD_OUTBOX) ?? '[]') as { op: Op; user: string }[]
    localStorage.removeItem(OLD_OUTBOX)
    return Array.isArray(items) ? items.filter((i) => i?.user === user && i.op).map((i) => i.op) : []
  } catch {
    return []
  }
}

/** The account's days with these (old outbox) changes laid over them. */
export function overlayDays(days: Days, ops: Op[]): Days {
  const out = { ...days }
  for (const op of ops) {
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

/** The account's notes with these (old outbox) changes laid over them. */
export function overlayNotes(notes: Notes, ops: Op[]): Notes {
  const out: Notes = { ...notes }
  const put = (date: string, fn: (l: Note[]) => Note[]) => {
    out[date] = fn(out[date] ?? []).sort((a, b) => a.writtenAt.localeCompare(b.writtenAt))
  }
  for (const op of ops) {
    if (!('note' in op)) continue
    const id = op.note.id
    if (op.k === 'note-add') put(op.note.date, (l) => [...l.filter((n) => n.id !== id), op.note])
    else if (op.k === 'note-body') put(op.note.date, (l) => l.map((n) => (n.id === id ? { ...n, body: op.body } : n)))
    else if (op.k === 'note-pin')
      put(op.note.date, (l) => l.map((n) => (n.id === id ? { ...n, pinned: op.pinned || undefined } : n)))
    else put(op.note.date, (l) => l.filter((n) => n.id !== id))
  }
  return out
}
