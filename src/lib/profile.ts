import { supabase } from './supabase'

/** Birth date and hoped-for lifespan: how many squares a life holds. */
export type Profile = { born: string; lifespan: number }

const KEY = 'squared.profile' // demo mode keeps it on this device

/** The saved profile, or null if there's none yet (or migration 0005 hasn't been run). */
export async function fetchProfile(): Promise<Profile | null> {
  if (!supabase) {
    try {
      return JSON.parse(localStorage.getItem(KEY) ?? 'null')
    } catch {
      return null
    }
  }
  const { data, error } = await supabase.from('profiles').select('born, lifespan').maybeSingle()
  if (error) {
    console.error('Could not load profile', error)
    return null
  }
  return data
}

export async function saveProfile(p: Profile): Promise<void> {
  if (!supabase) {
    localStorage.setItem(KEY, JSON.stringify(p))
    return
  }
  const { error } = await supabase.from('profiles').upsert({ born: p.born, lifespan: p.lifespan })
  if (error) throw error
}
