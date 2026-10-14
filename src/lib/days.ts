import type { Paint } from './paints'
import { supabase } from './supabase'

export type Day = { color: Paint; note?: string }
export type Days = Record<string, Day>

const timeZone = () => Intl.DateTimeFormat().resolvedOptions().timeZone

/** All painted days in the month containing `iso` (YYYY-MM-DD). */
export async function fetchMonth(iso: string): Promise<Days> {
  if (!supabase) return {}
  const [y, m] = iso.split('-').map(Number)
  const first = `${iso.slice(0, 7)}-01`
  const last = `${iso.slice(0, 7)}-${String(new Date(y, m, 0).getDate()).padStart(2, '0')}`
  const { data, error } = await supabase
    .from('days')
    .select('date, color, note')
    .gte('date', first)
    .lte('date', last)
  if (error) throw error
  const out: Days = {}
  for (const row of data) out[row.date] = { color: row.color as Paint, note: row.note ?? undefined }
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

export async function saveNote(date: string, note: string | null): Promise<void> {
  if (!supabase) return
  const { error } = await supabase.from('days').update({ note }).eq('date', date)
  if (error) throw error
}
