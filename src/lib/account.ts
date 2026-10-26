import { supabase } from './supabase'

/** Delete the signed-in account and everything in it (migration 0011), then this device's copies. An optional reason
 *  ("why are you leaving?") is kept with no name attached (migration 0021). */
export async function deleteMyAccount(reason = ''): Promise<void> {
  if (supabase) {
    const why = reason.trim()
    let { error } = await supabase.rpc('delete_my_account', why ? { reason: why } : {})
    // Before 0021 is run, the database only knows the version without a reason: delete anyway, never block on it.
    if (error && why && error.code === 'PGRST202') ({ error } = await supabase.rpc('delete_my_account'))
    if (error) throw error
  }
  for (const key of Object.keys(localStorage)) if (key.startsWith('squared.')) localStorage.removeItem(key)
}
