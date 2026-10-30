import { saveColor, saveFramed, saveOutOfHands, wipeDay } from './days'
import { addNote, deleteNote, replaceNote, setNoteColor, setPinned, type Note } from './notes'
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
  | { k: 'hands'; date: string; outOfHands: boolean }
  | { k: 'note-add'; note: Note }
  | { k: 'note-body'; note: Note; body: string }
  | { k: 'note-pin'; note: Note; pinned: boolean }
  | { k: 'note-color'; note: Note; color: Paint | null }
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
      case 'hands':
        return saveOutOfHands(op.date, op.outOfHands)
      case 'note-add':
        return addNote(op.note)
      case 'note-body':
        return replaceNote(op.note, op.body)
      case 'note-pin':
        return setPinned(op.note, op.pinned)
      case 'note-color':
        return setNoteColor(op.note, op.color)
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
const unsaved = () => queue.length > 0

// The connection is back, or the app is: a stuck save tries again by itself (the message stays until it's in).
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => failed && retrySaves())
  document.addEventListener('visibilitychange', () => document.visibilityState === 'visible' && failed && retrySaves())
  window.addEventListener('beforeunload', (e) => {
    if (unsaved()) e.preventDefault()
  })
}
