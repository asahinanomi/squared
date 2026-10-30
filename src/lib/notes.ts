import type { Days } from './days'
import type { Paint } from './paints'
import { supabase } from './supabase'

export type Note = {
  id: string
  date: string
  body: string
  writtenAt: string
  /** A framed day's note, "what do you want to remember?": always first, in the frame's green. */
  pinned?: boolean
  /** The moment's own colour, if you painted it (optional): a torn day's mix lives in its moments. */
  color?: Paint
}
/** Notes per day (YYYY-MM-DD), oldest first. */
export type Notes = Record<string, Note[]>
/** The open "why?" box: a new note, or an existing one; after a failed save it carries the text and why. */
export type Why = {
  note?: Note
  draft?: string
  error?: string
  n?: number
  /** A new note for a day just framed: it's pinned, and asks "what do you want to remember?". */
  pinned?: boolean
}

type Row = { id: string; date: string; body: string; written_at: string; pinned?: boolean; color?: Paint | null }
const toNote = (r: Row): Note => ({
  id: r.id,
  date: r.date,
  body: r.body,
  writtenAt: r.written_at,
  pinned: r.pinned || undefined,
  color: r.color || undefined,
})

// The columns to read: color once migration 0022 has run, pinned once 0014 has (until then, notes load without them).
const COLS = [
  'id, date, body, written_at, pinned, color',
  'id, date, body, written_at, pinned',
  'id, date, body, written_at',
]
let level = 0
const cols = () => COLS[level]
const withPinned = () => level < 2
const withColor = () => level < 1
/** Run a query; if a newer column doesn't exist yet, remember that and run it again without. */
async function tryPinned<T extends { error: { code?: string } | null }>(run: () => PromiseLike<T>): Promise<T> {
  let res = await run()
  while (res.error?.code === '42703' && level < COLS.length - 1) {
    level++
    res = await run()
  }
  return res
}

function groupByDay(list: Note[]): Notes {
  const out: Notes = {}
  for (const n of [...list].sort((a, b) => a.writtenAt.localeCompare(b.writtenAt))) (out[n.date] ??= []).push(n)
  return out
}

/** Before migration 0004 there is no notes table: show each day's single legacy note instead. */
export function legacyNotes(days: Days): Notes {
  const out: Notes = {}
  for (const [date, d] of Object.entries(days))
    if (d.note) out[date] = [{ id: `legacy-${date}`, date, body: d.note, writtenAt: d.noteAt ?? `${date}T12:00:00Z` }]
  return out
}

/** All notes in the month containing `iso`, or null if the notes table doesn't exist yet. */
export async function fetchMonthNotes(iso: string): Promise<Notes | null> {
  if (!supabase) return {}
  const [y, m] = iso.split('-').map(Number)
  const first = `${iso.slice(0, 7)}-01`
  const last = `${iso.slice(0, 7)}-${String(new Date(y, m, 0).getDate()).padStart(2, '0')}`
  const sb = supabase
  const { data, error } = await tryPinned(() =>
    sb.from('notes').select(cols()).gte('date', first).lte('date', last).order('written_at'),
  )
  if (error?.code === 'PGRST205' || error?.code === '42P01') return null
  if (error) throw error
  return groupByDay((data as unknown as Row[]).map(toNote))
}

/** Every note, all of a life (fetched a page at a time), or null if the notes table doesn't exist yet. */
export async function fetchAllNotes(): Promise<Notes | null> {
  if (!supabase) return null
  const all: Row[] = []
  for (let from = 0; ; from += 1000) {
    const sb = supabase
    const { data, error } = await tryPinned(() =>
      sb
        .from('notes')
        .select(cols())
        .order('written_at')
        .range(from, from + 999),
    )
    if (error?.code === 'PGRST205' || error?.code === '42P01') return null
    if (error) throw error
    all.push(...(data as unknown as Row[]))
    if (!data || data.length < 1000) break
  }
  return groupByDay(all.map(toNote))
}

/** A note made on this device, shown at once while it saves. */
export const draftNote = (date: string, body: string, pinned?: boolean): Note => ({
  id: crypto.randomUUID(),
  date,
  body,
  writtenAt: new Date().toISOString(),
  pinned,
})

/** Save a new note. Its id is made here, so a retried insert can't create a twin. */
export async function addNote(note: Note): Promise<Note> {
  if (!supabase) return note
  const sb = supabase
  const { data, error } = await tryPinned(() =>
    sb
      .from('notes')
      .insert({
        id: note.id,
        date: note.date,
        body: note.body,
        ...(withPinned() && note.pinned ? { pinned: true } : {}),
        ...(withColor() && note.color ? { color: note.color } : {}),
      })
      .select(cols())
      .single(),
  )
  if (error?.code === '23505') return note // the first try got through after all
  if (error) throw error
  return { ...toNote(data as unknown as Row), pinned: note.pinned, color: note.color }
}

/** Overwrite a note's text; the database refreshes its time. */
export async function replaceNote(note: Note, body: string): Promise<Note> {
  if (!supabase) return { ...note, body, writtenAt: new Date().toISOString() }
  const sb = supabase
  const { data, error } = await tryPinned(() =>
    sb.from('notes').update({ body }).eq('id', note.id).select(cols()).single(),
  )
  if (error) throw error
  return { ...toNote(data as unknown as Row), pinned: note.pinned, color: note.color }
}

/** Paint a moment in its own colour, or take the colour away (null). */
export async function setNoteColor(note: Note, color: Paint | null): Promise<void> {
  if (!supabase || !withColor()) return
  const { error } = await supabase.from('notes').update({ color }).eq('id', note.id)
  if (error) throw error
}

/** Pin or unpin a note (a framed day's note; unframing the day unpins it). */
export async function setPinned(note: Note, pinned: boolean): Promise<void> {
  if (!supabase || !withPinned()) return
  const { error } = await supabase.from('notes').update({ pinned }).eq('id', note.id)
  if (error) throw error
}

export async function deleteNote(note: Note): Promise<void> {
  if (!supabase) return
  const { error } = await supabase.from('notes').delete().eq('id', note.id)
  if (error) throw error
}
