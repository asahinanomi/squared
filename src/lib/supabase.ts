import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

/** Null until the Supabase env vars are set; the app then runs in local demo mode. */
export const supabase = url && key ? createClient(url, key, { auth: { flowType: 'pkce' } }) : null

export async function signInWithGoogle() {
  if (!supabase) return
  await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: window.location.origin },
  })
}

/** The question text, stored as a single configurable value. */
export async function fetchQuestion(): Promise<string | null> {
  if (!supabase) return null
  const { data } = await supabase.from('settings').select('value').eq('key', 'question').maybeSingle()
  return data?.value ?? null
}
