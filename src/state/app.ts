import { supabase } from '../lib/supabase'

// What the whole app shares: its screens, and what the web address asked for when it opened.

export type Screen =
  | 'today'
  | 'month'
  | 'life'
  | 'pie'
  | 'list'
  | 'idea'
  | 'setup'
  | 'settings'
  | 'matters'
  | 'privacy'
  | 'terms'
  | 'questions'
  | 'export'
  | 'paintings'
  | 'framed'
  | 'mydays'
/** The zoom ladder, closest first. Zooming out always lands on (and centres) today. */
export const LADDER: Screen[] = ['today', 'month', 'life']
/** Settings and the pages it opens. */
export const PAGES: Screen[] = [
  'settings',
  'setup',
  'matters',
  'privacy',
  'terms',
  'questions',
  'export',
  'paintings',
  'framed',
  'mydays',
]

// Without Supabase env vars the app runs as a local demo: no sign-in, fake days, nothing saved.
export const demo = !supabase
const params = new URLSearchParams(location.search)
// A test link (?welcome, ?month, ?year, ?birthday) or ?touch opened while signed out survives the trip through Google
// sign-in, which returns to the bare address: kept on the device for 10 minutes, used once when it comes back.
const TEST_KEY = 'squared.testLink'
const TESTS = ['welcome', 'month', 'year', 'birthday', 'touch']
// Back from Google: a ?code, or an #id_token (direct sign-in).
const returning = location.search.includes('code=') || /id_token|access_token/.test(location.hash)
try {
  const asked = TESTS.find((t) => params.has(t))
  if (asked) localStorage.setItem(TEST_KEY, JSON.stringify({ t: asked, at: Date.now() }))
  else if (returning) {
    const kept = JSON.parse(localStorage.getItem(TEST_KEY) ?? 'null') as { t: string; at: number } | null
    if (kept && Date.now() - kept.at < 10 * 60_000) params.set(kept.t, '')
    localStorage.removeItem(TEST_KEY)
  }
} catch {
  /* without storage, a test link works only while signed in */
}
// The first visit's sheet (each square is a day, the three colours) shows once on this device.
const INTRO_KEY = 'squared.introSeen'
export const introSeen = () => {
  try {
    return localStorage.getItem(INTRO_KEY) === '1'
  } catch {
    return false
  }
}
export const markIntroSeen = () => {
  try {
    localStorage.setItem(INTRO_KEY, '1')
  } catch {
    /* it may show again: harmless */
  }
}
/** A test walked through: nothing left to carry through a sign-in. */
export const forgetTestLink = () => {
  try {
    localStorage.removeItem(TEST_KEY)
  } catch {
    /* nothing kept */
  }
}
// squared.today/?welcome shows the first visit's sheet (each square is a day, the three colours) on any account.
export let tryWelcome = params.has('welcome')
/** The ?welcome test seen through: the address is plain again, and the sheet shows only to someone new. */
export const endWelcomeTest = () => {
  if (!tryWelcome) return
  tryWelcome = false
  history.replaceState(null, '', location.pathname)
  forgetTestLink()
}
// squared.today/?month shows last month's painting, to try it (it changes nothing).
export const tryMonth = params.has('month')
// squared.today/?year shows last year's painting, the January 1st moment, to try it.
export const tryYear = params.has('year')
// squared.today/?birthday shows the birthday sheet on today, any day (it changes nothing).
export const tryBirthday = params.has('birthday')

export type Legal = 'privacy' | 'terms' | 'questions'
/** squared.today/privacy, /terms and /faq open those pages directly (signed in or not). */
export const legalAt = (): Legal | null =>
  ['/privacy', '/terms', '/questions'].includes(location.pathname)
    ? (location.pathname.slice(1) as Legal)
    : location.pathname === '/faq'
      ? 'questions'
      : null
export const legalAtStart = legalAt()
export const leaveLegalUrl = () => legalAt() && history.replaceState(null, '', '/')
/** squared.today/idea opens the letter (signed out) or the about page (signed in). */
export const ideaAtStart = location.pathname === '/idea'
/** squared.today/?touch opens "get in touch" (about's tab), after signing in if need be: the link for testers. */
export let touchAtStart = params.has('touch')
/** Get in touch reached from the link: the address is plain again. */
export const endTouchLink = () => {
  if (!touchAtStart) return
  touchAtStart = false // once: about opens on its letter after this
  history.replaceState(null, '', location.pathname)
  forgetTestLink()
}
