import { supabase } from '../lib/supabase'

// What the whole app shares: its screens, and what the web address asked for when it opened.

export type Screen =
  | 'home'
  | 'today'
  | 'month'
  | 'year'
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
  | 'welcome'
/** The zoom ladder, closest first. Zooming out always lands on (and centres) today. */
export const LADDER: Screen[] = ['today', 'month', 'year', 'life']
/** Screens with their own back arrow, no top bar. */
export const NO_TOPBAR: Screen[] = [
  'setup',
  'welcome',
  'settings',
  'matters',
  'privacy',
  'terms',
  'questions',
  'export',
  'paintings',
]

// Without Supabase env vars the app runs as a local demo: no sign-in, fake days, nothing saved.
export const demo = !supabase
const params = new URLSearchParams(location.search)
// squared.today/?welcome opens onboarding on any account, to try it: nothing is saved.
export const tryWelcome = params.has('welcome')
// squared.today/?squares opens "how many squares?" as the first time shows it, to try it: nothing is saved.
export const trySquaresAtStart = params.has('squares')
// squared.today/?month shows last month's painting, to try it (it changes nothing).
export const tryMonth = params.has('month')
// squared.today/?year shows last year's painting, the January 1st moment, to try it.
export const tryYear = params.has('year')

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
