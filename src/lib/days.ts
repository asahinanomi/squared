import type { Paint } from './paints'
import { supabase } from './supabase'

export type Day = { color: Paint; note?: string; /** when the note was last written (ISO) */ noteAt?: string }
export type Days = Record<string, Day>

const timeZone = () => Intl.DateTimeFormat().resolvedOptions().timeZone

/** All painted days in the month containing `iso` (YYYY-MM-DD). */
export async function fetchMonth(iso: string): Promise<Days> {
  if (!supabase) return {}
  const [y, m] = iso.split('-').map(Number)
  const first = `${iso.slice(0, 7)}-01`
  const last = `${iso.slice(0, 7)}-${String(new Date(y, m, 0).getDate()).padStart(2, '0')}`
  const query = (cols: string) => supabase!.from('days').select(cols).gte('date', first).lte('date', last)
  let { data, error } = await query('date, color, note, note_at')
  // Before migration 0002 the note_at column doesn't exist yet; still load the squares.
  if (error?.code === '42703') ({ data, error } = await query('date, color, note'))
  if (error) throw error
  const rows = (data ?? []) as unknown as { date: string; color: Paint; note: string | null; note_at?: string | null }[]
  const out: Days = {}
  for (const row of rows) out[row.date] = { color: row.color, note: row.note ?? undefined, noteAt: row.note_at ?? undefined }
  return out
}

/** Paint (or repaint) a day. The database decides painted_on_day on first paint. */
export async function saveColor(date: string, color: Paint): Promise<void> {
  if (!supabase) return
  const { error } = await supabase
    .from('days')
    .upsert({ date, color, time_zone: timeZone() }, { onConflict: 'user_id,date' })
  if (error) throw error
}
