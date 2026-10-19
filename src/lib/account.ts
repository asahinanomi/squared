import { supabase } from './supabase'

/** Delete the signed-in account and everything in it (migration 0011), then this device's copies. */
export async function deleteMyAccount(): Promise<void> {
  if (supabase) {
    const { error } = await supabase.rpc('delete_my_account')
    if (error) throw error
  }
  for (const key of Object.keys(localStorage)) if (key.startsWith('squared.')) localStorage.removeItem(key)
}
