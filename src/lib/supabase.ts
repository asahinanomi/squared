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

// Google sign-in straight from squared.today, so Google's screen says "continue to squared.today"
// (not the Supabase address). Google sends an ID token back here; Supabase turns it into a session.
// Without VITE_GOOGLE_CLIENT_ID it falls back to Supabase's own Google redirect.
const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined
const NONCE_KEY = 'squared.signin'

const sha256 = async (text: string) =>
  [...new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text)))]
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')

export async function signInWithGoogle() {
  if (!supabase) return
  if (!googleClientId) {
    await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin } })
    return
  }
  // A one-time secret: Google signs its hash into the token, Supabase checks it against the original.
  const nonce = crypto.randomUUID()
  const state = crypto.randomUUID()
  sessionStorage.setItem(NONCE_KEY, JSON.stringify({ nonce, state }))
  const q = new URLSearchParams({
    client_id: googleClientId,
    redirect_uri: `${location.origin}/`,
    response_type: 'id_token',
    scope: 'openid email profile',
    nonce: await sha256(nonce),
    state,
    prompt: 'select_account',
  })
  location.assign(`https://accounts.google.com/o/oauth2/v2/auth?${q}`)
}

let finishing: Promise<string | null> | null = null

/**
 * Completes a Google redirect — an ID token in the #hash (direct sign-in) or a ?code (Supabase's
 * redirect) — then cleans the URL. Returns a readable error when sign-in didn't finish.
 * Runs once per page load.
 */
export function finishSignIn(): Promise<string | null> {
  finishing ??= (async () => {
    if (!supabase) return null
    const hash = new URLSearchParams(location.hash.slice(1))
    if (hash.has('id_token') || hash.has('error')) {
      history.replaceState(null, '', location.pathname)
      const saved = JSON.parse(sessionStorage.getItem(NONCE_KEY) ?? 'null') as { nonce: string; state: string } | null
      sessionStorage.removeItem(NONCE_KEY)
      if (hash.has('error')) return hash.get('error') === 'access_denied' ? null : 'Google sign-in didn’t finish.'
      if (!saved || saved.state !== hash.get('state')) return 'Sign-in expired, please try again.'
      const { error } = await supabase.auth.signInWithIdToken({
        provider: 'google',
        token: hash.get('id_token')!,
        nonce: saved.nonce,
      })
      return error ? error.message : null
    }
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
