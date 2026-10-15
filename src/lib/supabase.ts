import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

// After a phone wakes the app, the first request can ride a dead connection and hang for a minute.
// Give each request 10s, then try once more on a fresh one.
const TIMEOUT_MS = 10_000

async function patientFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  for (let attempt = 0; ; attempt++) {
    const timeout = AbortSignal.timeout(TIMEOUT_MS)
    const signal = init?.signal && 'any' in AbortSignal ? AbortSignal.any([init.signal, timeout]) : timeout
    try {
      return await fetch(input, { ...init, signal })
    } catch (e) {
      if (attempt > 0 || init?.signal?.aborted) throw e
    }
  }
}

/** Null until the Supabase env vars are set; the app then runs in local demo mode. */
export const supabase =
  url && key
    ? createClient(url, key, {
        auth: { flowType: 'pkce', detectSessionInUrl: false },
        global: { fetch: patientFetch },
      })
    : null

// Renew the sign-in as soon as the app comes back to the screen, not on the next save.
if (supabase) {
  const sb = supabase
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') sb.auth.startAutoRefresh()
    else sb.auth.stopAutoRefresh()
  })
}

export async function signInWithGoogle() {
  if (!supabase) return
  await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: window.location.origin },
  })
}

let finishing: Promise<string | null> | null = null

/**
 * Completes a Google redirect: trades the ?code for a session and cleans the URL.
 * Returns a readable error when sign-in didn't finish. Runs once per page load.
 */
export function finishSignIn(): Promise<string | null> {
  finishing ??= (async () => {
    if (!supabase) return null
    const params = new URLSearchParams(location.search)
    const code = params.get('code')
    const failed = params.get('error_description')
    if (code || failed) history.replaceState(null, '', location.pathname)
    if (failed) return failed
    if (!code) return null
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    return error ? error.message : null
  })()
  return finishing
}

/** The question text, stored as a single configurable value. */
export async function fetchQuestion(): Promise<string | null> {
  if (!supabase) return null
  const { data } = await supabase.from('settings').select('value').eq('key', 'question').maybeSingle()
  return data?.value ?? null
}
