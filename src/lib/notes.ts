import type { Days } from './days'
import { supabase } from './supabase'

export type Note = { id: string; date: string; body: string; writtenAt: string }
/** Notes per day (YYYY-MM-DD), oldest first. */
export type Notes = Record<string, Note[]>

type Row = { id: string; date: string; body: string; written_at: string }
const toNote = (r: Row): Note => ({ id: r.id, date: r.date, body: r.body, writtenAt: r.written_at })

export function groupByDay(list: Note[]): Notes {
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
  const { data, error } = await supabase
    .from('notes')
    .select('id, date, body, written_at')
    .gte('date', first)
    .lte('date', last)
    .order('written_at')
  if (error?.code === 'PGRST205' || error?.code === '42P01') return null
  if (error) throw error
  return groupByDay((data as Row[]).map(toNote))
}

const local = (date: string, body: string): Note => ({
  id: `local-${crypto.randomUUID()}`,
  date,
  body,
  writtenAt: new Date().toISOString(),
})

/** A new note stamped now. */
export async function addNote(date: string, body: string): Promise<Note> {
  if (!supabase) return local(date, body)
  const { data, error } = await supabase
    .from('notes')
    .insert({ date, body })
    .select('id, date, body, written_at')
    .single()
  if (error) throw error
  return toNote(data as Row)
}

/** Overwrite a note's text; the database refreshes its time. */
export async function replaceNote(note: Note, body: string): Promise<Note> {
  if (!supabase) return { ...note, body, writtenAt: new Date().toISOString() }
  const { data, error } = await supabase
    .from('notes')
    .update({ body })
    .eq('id', note.id)
    .select('id, date, body, written_at')
    .single()
  if (error) throw error
  return toNote(data as Row)
}

export async function deleteNote(note: Note): Promise<void> {
  if (!supabase) return
  const { error } = await supabase.from('notes').delete().eq('id', note.id)
  if (error) throw error
}
