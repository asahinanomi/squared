import { reportError } from './report'
import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

// iPhone Safari keeps one connection to the database open and reuses it for every request. On mobile data that
// connection can die quietly while squared sits open (the network drops it; Safari doesn't notice), and every retry
// then rides the same dead line and hangs (client_errors, Oct 2026: saves hanging the full 41s, online, minutes
// after waking). So each request gets 8s, and the next try goes the other way: direct, or through squared.today's
// own /sb/ (a Vercel rewrite to the same database), which is a different address and so a fresh connection.
// Whichever way last worked goes first.
const TIMEOUT_MS = 8_000
const viaSite = !import.meta.env.DEV && typeof location !== 'undefined' && location.hostname === 'squared.today'
let preferSite = false
const throughSite = (input: RequestInfo | URL): string | null => {
  const href = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url
  return url && viaSite && href.startsWith(url) ? `${location.origin}/sb${href.slice(url.length)}` : null
}

// A plain timer and controller (not AbortSignal.timeout/any, which some Safari versions handle unreliably).
async function patientFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const alt = throughSite(input)
  for (let attempt = 0; ; attempt++) {
    const site = !!alt && (attempt % 2 === 0) === preferSite
    const ctrl = new AbortController()
    const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS)
    const outer = init?.signal
    const follow = () => ctrl.abort()
    outer?.addEventListener('abort', follow)
    try {
      const res = await fetch(site ? alt! : input, { ...init, signal: ctrl.signal })
      if (alt) preferSite = site
      return res
    } catch (e) {
      if (attempt > 0 || outer?.aborted) throw e
    } finally {
      clearTimeout(timer)
      outer?.removeEventListener('abort', follow)
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

// The one-time secrets of sign-ins on their way through Google, matched by their state when Google sends you back.
// Kept in localStorage (not one tab's sessionStorage, which a reload, a discarded tab or a second tap could lose),
// the last few, for 20 minutes.
type Pending = { state: string; nonce: string; at: number }
const PENDING_MS = 20 * 60_000
const readPending = (): Pending[] => {
  try {
    const v = JSON.parse(localStorage.getItem(NONCE_KEY) ?? '[]')
    return (Array.isArray(v) ? v : []).filter((p: Pending) => Date.now() - p.at < PENDING_MS)
  } catch {
    return []
  }
}
const writePending = (list: Pending[]) => {
  try {
    localStorage.setItem(NONCE_KEY, JSON.stringify(list.slice(-5)))
  } catch {
    /* private mode: this sign-in may need a second try */
  }
}

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
  writePending([...readPending(), { nonce, state, at: Date.now() }])
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

const NETWORK = 'check your connection and try again'

/** Back from Google with an answer to finish (the hourglass says so meanwhile). */
export const backFromGoogle = /[#&]id_token=|[?&]code=/.test(location.hash + location.search)

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
      const pending = readPending()
      const saved = pending.find((p) => p.state === hash.get('state'))
      writePending(pending.filter((p) => p !== saved))
      if (hash.has('error')) return hash.get('error') === 'access_denied' ? null : 'Google sign-in didn’t finish.'
      if (!saved) {
        // Already signed in (a stale return from Google): nothing to say.
        if ((await supabase.auth.getSession()).data.session) return null
        reportError('sign in', {
          code: 'no-pending',
          message: `no matching sign-in on this device (${pending.length} pending; standalone: ${matchMedia('(display-mode: standalone)').matches})`,
        })
        return 'Sign-in expired, please try again.'
      }
      // Google's answer is good for an hour: if the network drops it on the way to Supabase, try again (3 times).
      for (let attempt = 1; ; attempt++) {
        const started = Date.now()
        const { error } = await supabase.auth.signInWithIdToken({
          provider: 'google',
          token: hash.get('id_token')!,
          nonce: saved.nonce,
        })
        if (!error) return null
        reportError(`sign in (try ${attempt})`, error, Date.now() - started)
        const network = error.name === 'AuthRetryableFetchError' || !error.status
        if (!network || attempt >= 3) return network ? NETWORK : error.message
        await new Promise((r) => setTimeout(r, 1000 * attempt))
      }
    }
    const params = new URLSearchParams(location.search)
    const code = params.get('code')
    const failed = params.get('error_description')
    if (code || failed) history.replaceState(null, '', location.pathname)
    if (failed) return failed
    if (!code) return null
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (error) reportError('sign in (code)', error)
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
