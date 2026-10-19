import { supabase } from './supabase'

/** Send a note to the maker (the `feedback` table, migration 0010). In the local demo it goes nowhere. */
export async function sendFeedback(body: string): Promise<void> {
  if (!supabase) return
  const { error } = await supabase.from('feedback').insert({ body })
  if (error) throw error
}
