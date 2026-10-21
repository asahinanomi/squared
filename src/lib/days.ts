import type { Paint } from './paints'
import { addDays, isoDate, plainDate } from './dates'
import { supabase } from './supabase'

export type Day = {
  color: Paint
  /** first painted after the next day ended (its line says when) */
  backfilled?: boolean
  /** the date it was first painted on (repaints keep it): a journal's entry date */
  paintedOn?: string
  note?: string
  /** when the note was last written (ISO) */
  noteAt?: string
  /** the date its colour last changed (a repaint in a new colour), if ever */
  changedOn?: string
  /** a day that mattered most, framed (green days only) */
  framed?: boolean
}

/**
 * The one honest line under a painted square's word: "painted on time", "painted Oct 21" (late), or
 * "repainted Oct 23" once its colour changed after the grace window (the day after it was first painted,
 * or after the day itself, whichever is later).
 */
export function stampLine(date: string, day: Day): string {
  const grace = [addDays(date, 1), day.paintedOn ? addDays(day.paintedOn, 1) : ''].sort().pop()!
  if (day.changedOn && day.changedOn > grace) return `repainted ${plainDate(day.changedOn)}`
  if (day.backfilled && day.paintedOn) return `painted ${plainDate(day.paintedOn)}`
  return 'painted on time'
}
export type Days = Record<string, Day>

const timeZone = () => Intl.DateTimeFormat().resolvedOptions().timeZone

type Row = {
  date: string
  color: Paint
  painted_on_day?: boolean
  created_at?: string
  note: string | null
  note_at?: string | null
  changed_at?: string | null
  framed?: boolean
}

const PAGE = 1000 // Supabase returns at most this many rows per request

/** Every painted day, all of a life (fetched a page at a time). */
export async function fetchAllDays(): Promise<Days> {
  if (!supabase) return {}
  const sb = supabase
  const page = async (cols: string, from: number) =>
    sb
      .from('days')
      .select(cols)
      .order('date')
      .range(from, from + PAGE - 1)
  let cols = 'date, color, painted_on_day, created_at, changed_at, framed, note, note_at'
  const out: Days = {}
  for (let from = 0; ; from += PAGE) {
    let { data, error } = await page(cols, from)
    // Before migrations 0012 and 0013 there's no changed_at or framed yet; load the squares without them.
    if (error?.code === '42703' && cols.includes('framed')) {
      cols = cols.replace(' framed,', '')
      ;({ data, error } = await page(cols, from))
    }
    if (error?.code === '42703' && cols.includes('changed_at')) {
      cols = cols.replace(' changed_at,', '')
      ;({ data, error } = await page(cols, from))
    }
    // Before migration 0002 the note_at column doesn't exist yet; still load the squares.
    if (error?.code === '42703' && cols.includes('note_at')) {
      cols = 'date, color, painted_on_day, created_at, note'
      ;({ data, error } = await page(cols, from))
    }
    if (error) throw error
    const rows = (data ?? []) as unknown as Row[]
    for (const r of rows)
      out[r.date] = {
        color: r.color,
        backfilled: r.painted_on_day === false,
        paintedOn: r.created_at ? isoDate(new Date(r.created_at)) : undefined,
        note: r.note ?? undefined,
        noteAt: r.note_at ?? undefined,
        changedOn: r.changed_at ? isoDate(new Date(r.changed_at)) : undefined,
        framed: r.framed || undefined,
      }
    if (rows.length < PAGE) return out
  }
}

/** Wipe a day back to blank: its square goes (its notes, in their own table, stay). */
export async function wipeDay(date: string): Promise<void> {
  if (!supabase) return
  const { error } = await supabase.from('days').delete().eq('date', date)
  if (error) throw error
}

/** Frame (or unframe) a painted day. */
export async function saveFramed(date: string, framed: boolean): Promise<void> {
  if (!supabase) return
  const { error } = await supabase.from('days').update({ framed }).eq('date', date)
  if (error) throw error
}

/** Paint (or repaint) a day. The database decides painted_on_day on first paint. */
export async function saveColor(date: string, color: Paint): Promise<void> {
  if (!supabase) return
  const { error } = await supabase
    .from('days')
    .upsert({ date, color, time_zone: timeZone() }, { onConflict: 'user_id,date' })
  if (error) throw error
}
