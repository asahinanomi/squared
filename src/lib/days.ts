import type { Paint } from './paints'
import { isoDate } from './dates'
import { supabase } from './supabase'

export type Day = {
  color: Paint
  /** first painted after noon the next day (shown one shade lighter) */
  backfilled?: boolean
  /** the date it was first painted on (repaints keep it): a journal's entry date */
  paintedOn?: string
  note?: string
  /** when the note was last written (ISO) */
  noteAt?: string
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
  let cols = 'date, color, painted_on_day, created_at, note, note_at'
  const out: Days = {}
  for (let from = 0; ; from += PAGE) {
    let { data, error } = await page(cols, from)
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

/** Paint (or repaint) a day. The database decides painted_on_day on first paint. */
export async function saveColor(date: string, color: Paint): Promise<void> {
  if (!supabase) return
  const { error } = await supabase
    .from('days')
    .upsert({ date, color, time_zone: timeZone() }, { onConflict: 'user_id,date' })
  if (error) throw error
}
