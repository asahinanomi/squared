import { useCallback, useEffect, useRef, useState } from 'react'
import { usePinch, type Focal } from './lib/usePinch'
import type { Session } from '@supabase/supabase-js'
import { MeaningSheet } from './components/MeaningSheet'
import { MonthPainting } from './components/MonthPainting'
import { Topbar } from './components/Topbar'
import { ViewSwitch } from './components/ZoomBar'
import { Settings } from './screens/Settings'
import { WhatMatters } from './screens/WhatMatters'
import { QUESTION } from './lib/config'
import { monthsAgo, paintedFresh, todayIso } from './lib/dates'
import { fetchAllDays, saveColor, saveFramed, wipeDay, type Days } from './lib/days'
import { mockDays } from './lib/mock'
import {
  addNote,
  deleteNote,
  draftNote,
  fetchAllNotes,
  setPinned,
  fetchMonthNotes,
  legacyNotes,
  replaceNote,
  type Note,
  type Notes,
  type Why,
} from './lib/notes'
import type { Paint } from './lib/paints'
import { fetchProfile, saveProfile, type Profile } from './lib/profile'
import { frameSound } from './lib/sound'
import { fetchQuestion, finishSignIn, signInWithGoogle, supabase } from './lib/supabase'
import { Idea } from './screens/Idea'
import { Month } from './screens/Month'
import { Year } from './screens/Year'
import { Life } from './screens/Life'
import { Pie } from './screens/Pie'
import { SCOPE_ORDER, type Scope } from './lib/pie'
import { LifeMonths } from './screens/LifeMonths'
import { Account } from './screens/Account'
import { DaysList } from './screens/DaysList'
import { PeriodList } from './screens/PeriodList'
import { Privacy } from './screens/Privacy'
import { About } from './screens/About'
import { Terms } from './screens/Terms'
import { Questions } from './screens/Questions'
import { Export } from './screens/Export'
import { LifeDays } from './screens/LifeDays'
import { LifeHead, type Resolution } from './components/LifeHead'
import { Setup } from './screens/Setup'
import { markWelcomed, Welcome, welcomed } from './screens/Welcome'
import { loadMatters, syncMatters } from './lib/matters'
import { SignIn } from './screens/SignIn'
import { Today } from './screens/Today'
import { Paintings } from './screens/Paintings'
import './App.css'

type Screen =
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
  | 'account'
  | 'privacy'
  | 'terms'
  | 'questions'
  | 'export'
  | 'paintings'
  | 'welcome'
/** The zoom ladder, closest first. Zooming out always lands on (and centres) today. */
const LADDER: Screen[] = ['today', 'month', 'year', 'life']

const byTime = (a: Note, b: Note) => a.writtenAt.localeCompare(b.writtenAt)

// Without Supabase env vars the app runs as a local demo: no sign-in, fake days, nothing saved.
const demo = !supabase
// squared.today/?welcome opens onboarding on any account, to try it: nothing is saved.
const tryWelcome = new URLSearchParams(location.search).has('welcome')
// squared.today/?squares opens "how many squares?" as the first time shows it, to try it: nothing is saved.
const trySquaresAtStart = new URLSearchParams(location.search).has('squares')
// squared.today/privacy and /terms open those pages directly (signed in or not): links for Google's sign-in screen.
const legalAtStart = (
  ['/privacy', '/terms', '/questions'].includes(location.pathname)
    ? location.pathname.slice(1)
    : location.pathname === '/faq'
      ? 'questions'
      : null
) as 'privacy' | 'terms' | 'questions' | null
// squared.today/?month shows last month's painting, to try it (it changes nothing).
const tryMonth = new URLSearchParams(location.search).has('month')
const PAINTED_KEY = 'squared.paintedMonth' // the month whose arrival last showed a painting
const leaveLegalUrl = () => legalAtStart && history.replaceState(null, '', '/')

export default function App() {
  // undefined = still checking; null = signed out.
  const [session, setSession] = useState<Session | null | undefined>(demo ? null : undefined)
  const [demoIn, setDemoIn] = useState(false)
  // "the idea", opened from the sign-in screen.
  const [ideaOut, setIdeaOut] = useState(false)
  const [privacyOut, setPrivacyOut] = useState(legalAtStart === 'privacy')
  const [termsOut, setTermsOut] = useState(legalAtStart === 'terms')
  const [questionsOut, setQuestionsOut] = useState(legalAtStart === 'questions')
  // Where privacy and terms were opened from (settings or the menu): back returns there.
  const [legalFrom, setLegalFrom] = useState<Screen>('settings')
  const legalOpened = useRef(false) // opened from inside the app (not straight from its web address)
  const [authError, setAuthError] = useState<string | null>(null)
  const [question, setQuestion] = useState(QUESTION)
  const [screen, setScreenValue] = useState<Screen>(
    legalAtStart ?? (tryWelcome ? 'welcome' : trySquaresAtStart ? 'setup' : 'today'),
  )
  // Which way the last move went, so the new level can zoom in or out into place.
  const [motion, setMotion] = useState<'in' | 'out' | null>(null)
  // The month to open on when zooming in from a year (zooming out always lands on today's).
  const [monthFocus, setMonthFocus] = useState<string | undefined>()
  const [yearFocus, setYearFocus] = useState<number | undefined>()
  // Which view of a life: one square per year (where a life always lands), month or day.
  const [lifeRes, setLifeResValue] = useState<Resolution>('years')
  // Pinched in within a level (bigger squares, with labels): a notch, 0 = the level's own size.
  // Never remembered: every move to another level starts back at 0.
  const [mag, setMag] = useState(0)
  const [focal, setFocal] = useState<Focal | undefined>()
  const [monthAnchor, setMonthAnchor] = useState<{ iso?: string; y: number } | undefined>()
  // Where "how many squares?" returns to: a life, when it was asked for on the way there.
  const [afterSetup, setAfterSetup] = useState<Screen>(trySquaresAtStart ? 'life' : 'today')
  const [trySquares, setTrySquares] = useState(trySquaresAtStart)
  // The zoom level the pie was opened from: the switch returns there.
  const [pieFrom, setPieFrom] = useState<Screen>('life')
  // The list of days sits beside the ladder too: where it was opened from, and the day it opens on.
  const [listFrom, setListFrom] = useState<Screen>('month')
  const [listFocus, setListFocus] = useState(todayIso)
  // The list zooms too, within itself: years → months → days (→ the day). And the level it was opened at.
  const [listRes, setListRes] = useState<Resolution>('days')
  const [listZoomed, setListZoomed] = useState(false) // zoomed within the list since it opened
  // Only one slice's days (from the pie's "see them →"), until cleared or the list zooms out.
  const [listOnly, setListOnly] = useState<Paint | 'unpainted' | 'framed' | null>(null)
  // The list keeps this pointed at the day in the middle of the screen, for a pinch to open on.
  const listMid = useRef(() => todayIso())
  const daysNow = useRef<Days>({}) // the days as they are now, for callbacks that mustn't change with them
  // A day opened from the list goes back to the list when you zoom out of it.
  const [dayFromList, setDayFromList] = useState(false)
  // Which days the pie is out of; it always opens on the whole life.
  const [pieScope, setPieScope] = useState<Scope>('life')
  // Where settings was opened from: its back arrow returns there.
  const [settingsFrom, setSettingsFrom] = useState<Screen>('today')
  // What matters opens from settings, the idea or the day's compass; back returns there.
  const [mattersFrom, setMattersFrom] = useState<'settings' | 'idea' | 'today'>('settings')
  const [date, setDate] = useState(todayIso)
  const [days, setDays] = useState<Days>(() => (demo ? mockDays() : {}))
  daysNow.current = days
  const [loaded, setLoaded] = useState<Paint | null>(null)
  const [defining, setDefining] = useState(false)
  const [notes, setNotes] = useState<Notes>({})
  // The open "why?" bubble: a new note ({}), or an existing note being edited.
  const [why, setWhy] = useState<Why | null>(null)
  const [nudge, setNudge] = useState(false)
  const [frameError, setFrameError] = useState<string | null>(null)
  // A new month: the last one, shown once as a painting (on the first visit of the month, if it holds any squares).
  const [paintedMonth, setPaintedMonth] = useState<string | null>(null)
  const [paintedArrived, setPaintedArrived] = useState(false) // shown by the new month, not opened from the month view
  const [profile, setProfile] = useState<Profile | null>(null)
  // Signed in on a device that hasn't settled whether this is someone new: wait for the days before showing
  // anything, so today never flashes up before the welcome.
  const [checking, setChecking] = useState(() => !legalAtStart && !tryWelcome && !trySquaresAtStart && !welcomed())

  useEffect(() => {
    if (!supabase) return
    const sb = supabase
    finishSignIn().then(async (err) => {
      setAuthError(err)
      const { data } = await sb.auth.getSession()
      setSession(data.session)
    })
    const { data } = sb.auth.onAuthStateChange((_e, s) => setSession(s))
    return () => data.subscription.unsubscribe()
  }, [])

  const userId = session?.user.id

  // The current level's stage is what scales under your fingers while you pinch.
  const stage = useCallback(() => document.querySelector<HTMLElement>('.stage'), [])
  const pinchRef = useRef<{ onIn?: (at: Focal) => boolean | void; onOut?: (at: Focal) => boolean | void }>({})
  usePinch(stage, {
    onIn: (at) => (pinchRef.current.onIn ? pinchRef.current.onIn(at) : false),
    onOut: (at) => (pinchRef.current.onOut ? pinchRef.current.onOut(at) : false),
  })
  const signedIn = demo ? demoIn : !!userId

  // The demo keeps its profile on this device.
  useEffect(() => {
    if (demo) fetchProfile().then(setProfile)
  }, [])

  // Load the question, every painted day, this month's notes and the profile for whoever is signed in.
  useEffect(() => {
    if (!userId) {
      if (!demo) {
        setDays({})
        setNotes({})
      }
      return
    }
    fetchQuestion().then((q) => q && setQuestion(q))
    fetchProfile().then(setProfile)
    notesLoaded.current = new Set([todayIso().slice(0, 7)])
    Promise.all([fetchAllDays(), fetchMonthNotes(todayIso())])
      .then(([d, n]) => {
        setDays(d)
        setNotes(n ?? legacyNotes(d))
        // Someone new (nothing painted, no compass yet, here or in the account): a pause before the first square.
        if (legalAtStart || tryWelcome || trySquaresAtStart || welcomed()) return
        if (Object.keys(d).length) return markWelcomed()
        return syncMatters(loadMatters()).then((m) =>
          m.meaningful.length || m.wasted.length ? markWelcomed() : setScreenValue('welcome'),
        )
      })
      .catch((e) => console.error('Could not load days', e))
      .finally(() => setChecking(false))
  }, [userId])

  // Notes load a month at a time, as you visit days in it (or read past them on the month).
  const notesLoaded = useRef(new Set<string>())
  const loadNotes = useCallback(
    (iso: string) => {
      const m = iso.slice(0, 7)
      if (!userId || notesLoaded.current.has(m)) return
      notesLoaded.current.add(m)
      fetchMonthNotes(iso)
        .then((n) => n && setNotes((all) => ({ ...all, ...n })))
        .catch((e) => {
          notesLoaded.current.delete(m)
          console.error('Could not load notes', e)
        })
    },
    [userId],
  )
  useEffect(() => {
    loadNotes(date)
  }, [loadNotes, date])

  useEffect(() => {
    if ((userId && checking) || !Object.keys(days).length) return
    const now = todayIso().slice(0, 7)
    const last = (monthsAgo(`${now}-01`, 1) ?? '').slice(0, 7)
    let seen: string | null = null
    try {
      seen = localStorage.getItem(PAINTED_KEY)
    } catch {
      /* storage unavailable: it may show again, which is harmless */
    }
    if (!tryMonth && seen === now) return
    if (!Object.keys(days).some((iso) => iso.startsWith(last))) return
    setPaintedMonth(last)
    setPaintedArrived(true)
    try {
      localStorage.setItem(PAINTED_KEY, now)
    } catch {
      /* fine */
    }
  }, [checking, days, userId])

  // On this day: today's screen offers a glimpse of a year ago (or, if that's blank, a month ago).
  const glimpseIso = [12, 1].map((n) => monthsAgo(todayIso(), n)).find((iso) => iso && days[iso]) ?? null
  useEffect(() => {
    if (glimpseIso) loadNotes(glimpseIso)
  }, [loadNotes, glimpseIso])

  useEffect(() => {
    document.body.dataset.screen = document.documentElement.dataset.screen = signedIn ? screen : 'signin'
  }, [signedIn, screen])

  // Optimistic: show the paint at once, save in the background, roll back if it fails.
  const onFilled = useCallback(
    (color: Paint) => {
      setWhy({ settled: color, fresh: !daysNow.current[date] })
      let before: Days[string]
      setDays((d) => {
        before = d[date]
        // A first paint is on time on the day or the next day (the database decides for good);
        // repaints keep the first paint's shade and date.
        return {
          ...d,
          [date]: d[date]
            ? {
                ...d[date],
                color,
                changedOn: d[date].color !== color ? todayIso() : d[date].changedOn,
                // A frame is for a day that mattered most: painting it another colour takes it off.
                framed: color === 'green' ? d[date].framed : undefined,
              }
            : { backfilled: !paintedFresh(date), paintedOn: todayIso(), color },
        }
      })
      if (color !== 'green' && daysNow.current[date]?.framed)
        saveFramed(date, false).catch((e) => console.error('Could not unframe day', e))
      saveColor(date, color).catch((e) => {
        console.error('Could not save color', e)
        setWhy(null)
        setDays((d) => {
          const next = { ...d }
          if (before) next[date] = before
          else delete next[date]
          return next
        })
      })
    },
    [date],
  )

  // Wipe: the square goes blank at once and leaves every count; put back if the save fails.
  // Frame (or unframe) a day that mattered most: shown at once, saved in the background, put back if it fails.
  const onFrame = () => {
    const day = date
    const was = !!days[day]?.framed
    const put = (framed: boolean) => setDays((d) => (d[day] ? { ...d, [day]: { ...d[day], framed } } : d))
    put(!was)
    // A little magic, and a pinned note: what do you want to remember? (skippable). Unframing keeps notes pinned.
    if (!was) {
      frameSound()
      if (!(notes[day] ?? []).some((n) => n.pinned)) setWhy({ pinned: true })
    }
    saveFramed(day, !was).catch((e) => {
      console.error('Could not frame day', e)
      put(was)
      // Said, not silent: a quiet line under the square for a few seconds.
      setFrameError(was ? "couldn't unframe, check your connection" : "couldn't frame, check your connection")
      setTimeout(() => setFrameError(null), 4000)
    })
  }

  const onWipe = () => {
    const day = date
    const before = days[day]
    if (!before) return
    setWhy(null)
    setDays((d) => {
      const next = { ...d }
      delete next[day]
      return next
    })
    wipeDay(day).catch((e) => {
      console.error('Could not wipe day', e)
      setDays((d) => ({ ...d, [day]: before }))
    })
  }

  // Notes save instantly: the change shows at once and saves in the background. If saving fails,
  // it's undone and the box reopens on that day with the text and a quiet message.
  const putNotes = (day: string, fn: (list: Note[]) => Note[]) =>
    setNotes((all) => ({ ...all, [day]: fn(all[day] ?? []).sort(byTime) }))
  const swap = (day: string, id: string, to: Note) => putNotes(day, (l) => l.map((n) => (n.id === id ? to : n)))

  const failure = (e: unknown, verb: string) => {
    console.error(`Could not ${verb} note`, e)
    const code = (e as { code?: string })?.code
    return code === 'PGRST205' || code === '42P01'
      ? `couldn't ${verb}: the notes update (0004) hasn't been run in Supabase yet`
      : `couldn't ${verb}, check your connection and try again`
  }

  const reopen = (day: string, w: Why) => {
    setDate(day)
    setScreen('today')
    setWhy({ ...w, n: Date.now() })
  }

  const onSaveNote = async (note: Note | undefined, text: string) => {
    setWhy(null)
    if (note) {
      swap(note.date, note.id, {
        ...note,
        body: text,
        writtenAt: new Date().toISOString(),
      })
      try {
        swap(note.date, note.id, await replaceNote(note, text))
      } catch (e) {
        swap(note.date, note.id, note)
        reopen(note.date, { note, draft: text, error: failure(e, 'save') })
      }
    } else {
      const draft = draftNote(date, text, why?.pinned)
      putNotes(draft.date, (l) => [...l, draft])
      try {
        swap(draft.date, draft.id, await addNote(draft))
      } catch (e) {
        putNotes(draft.date, (l) => l.filter((n) => n.id !== draft.id))
        reopen(draft.date, { draft: text, error: failure(e, 'save') })
      }
    }
  }

  // Pin a note to the top of its day (or unpin it): shown at once, saved in the background, put back if it fails.
  const onPinNote = (note: Note) => {
    setWhy(null)
    const pinned = !note.pinned
    swap(note.date, note.id, { ...note, pinned: pinned || undefined })
    setPinned(note, pinned).catch((e) => {
      console.error('Could not pin note', e)
      swap(note.date, note.id, note)
    })
  }

  const onDeleteNote = async (note: Note) => {
    setWhy(null)
    putNotes(note.date, (l) => l.filter((n) => n.id !== note.id))
    try {
      await deleteNote(note)
    } catch (e) {
      putNotes(note.date, (l) => [...l, note])
      reopen(note.date, { note, error: failure(e, 'delete') })
    }
  }

  const onDryBrush = () => {
    setNudge(true)
    setTimeout(() => setNudge(false), 750)
  }

  if (session === undefined || (userId && checking)) return null
  if (!signedIn)
    return ideaOut ? (
      <div className="app">
        <Idea onBack={() => setIdeaOut(false)} />
      </div>
    ) : privacyOut ? (
      <div className="app">
        <Privacy
          onBack={() => {
            leaveLegalUrl()
            setPrivacyOut(false)
          }}
          backLabel="sign in"
        />
      </div>
    ) : questionsOut ? (
      <div className="app">
        <Questions
          onBack={() => {
            leaveLegalUrl()
            setQuestionsOut(false)
          }}
          backLabel="sign in"
        />
      </div>
    ) : termsOut ? (
      <div className="app">
        <Terms
          onBack={() => {
            leaveLegalUrl()
            setTermsOut(false)
          }}
          backLabel="sign in"
        />
      </div>
    ) : (
      <SignIn
        error={authError}
        onSignIn={demo ? () => setDemoIn(true) : signInWithGoogle}
        onIdea={() => setIdeaOut(true)}
        onPrivacy={() => setPrivacyOut(true)}
        onTerms={() => setTermsOut(true)}
      />
    )

  // The painter's signature on a month's painting: the first name.
  const painter = (session?.user.user_metadata?.full_name ?? session?.user.user_metadata?.name ?? '').split(' ')[0]
  const setScreen = (next: Screen) => {
    const a = LADDER.indexOf(screen)
    const b = LADDER.indexOf(next)
    setMotion(a < 0 || b < 0 || a === b ? null : b > a ? 'out' : 'in')
    setMag(0)
    if (next !== 'today') setDayFromList(false)
    setScreenValue(next)
  }

  // The three views of a life sit on the ladder too: years → months → days is zooming out.
  const RES: Resolution[] = ['years', 'months', 'days']
  const setLifeRes = (r: Resolution) => {
    setMotion(RES.indexOf(r) > RES.indexOf(lifeRes) ? 'out' : RES.indexOf(r) < RES.indexOf(lifeRes) ? 'in' : null)
    setMag(0)
    setLifeResValue(r)
  }

  const goToday = () => {
    setDayFromList(false)
    setDate(todayIso())
    setScreen('today')
  }
  // Zoom out of a day: to its month — or back to the list, if it was opened from there.
  const outOfDay = () => {
    if (!dayFromList) return goMonth()
    setWhy(null)
    setDayFromList(false)
    setScreen('list')
  }

  // Zoom out from the square: the month, always the current one.
  const goMonth = (focus?: string) => {
    setWhy(null)
    setMonthFocus(focus)
    setScreen('month')
  }
  const goYear = (focus?: number) => {
    setYearFocus(focus)
    setScreen('year')
  }
  // A life needs a birth date and a lifespan: the first time, ask (gently) on the way.
  const goLife = () => {
    setLifeResValue('years')
    if (profile) return setScreen('life')
    setAfterSetup('life')
    setScreenValue('setup')
  }
  // The pie sits beside the ladder: the switch in the bar opens it, and takes you back to the level you left.
  const togglePie = () => {
    if (screen === 'pie') return setScreen(pieFrom)
    setPieFrom(screen === 'list' ? listFrom : screen)
    setPieScope('life')
    if (profile) return setScreen('pie')
    setAfterSetup('pie')
    setScreenValue('setup')
  }
  // The list of days, the same way: open it on the day you were looking at, and its switch takes you back.
  // It opens at the level that matches the squares (a life → years, a year → months, a month → days); its
  // switch goes back where you came from, or — if you zoomed within the list — to the squares at that level.
  const toggleList = (at?: string) => {
    const day = at ?? todayIso()
    if (screen === 'list') {
      if (!listZoomed) return setScreen(listFrom)
      if (listRes === 'days') return goMonth(day)
      if (listRes === 'months') return goYear(Number(day.slice(0, 4)))
      return goLife()
    }
    const from = screen === 'pie' ? pieFrom : screen
    const res: Resolution = from === 'life' ? lifeRes : from === 'year' ? 'months' : 'days'
    setListFrom(from)
    setListOnly(null)
    setListRes(res)
    setListZoomed(false)
    setListFocus(day)
    setScreen('list')
  }
  const listIn = (at: string) => {
    // From the days: today's square, and zooming out of it comes back here.
    if (listRes === 'days') {
      setDate(todayIso())
      setScreen('today')
      return setDayFromList(true)
    }
    setListZoomed(true)
    setListFocus(at)
    setListRes(listRes === 'years' ? 'months' : 'days')
  }
  // The capsule under the life's title jumps straight to a level of the list, where you are.
  const listTo = (r: Resolution) => {
    setListOnly(null)
    setListZoomed(true)
    setListFocus(listMid.current())
    setListRes(r)
  }
  const listHead = profile && <LifeHead profile={profile} current={listRes} onPick={listTo} />
  const listOut = (at: string) => {
    if (listRes === 'years') return false
    setListOnly(null)
    setListZoomed(true)
    setListFocus(at)
    setListRes(listRes === 'days' ? 'months' : 'years')
  }
  const openSettings = () => {
    if (!['settings', 'setup', 'matters', 'account', 'privacy', 'terms', 'questions', 'export'].includes(screen))
      setSettingsFrom(screen)
    setScreenValue('settings')
  }
  const endTrySquares = () => {
    setTrySquares(false)
    history.replaceState(null, '', location.pathname)
    goToday()
  }
  // Back from privacy or terms: where it was opened from, or today when it came straight from its web address.
  const closeLegal = () => {
    if (legalOpened.current) return setScreenValue(legalFrom)
    leaveLegalUrl()
    legalOpened.current = true
    goToday()
  }
  // Back from the small print: "settings" when opened there, "back" from the menu, "today" from its web address.
  const legalBack = !legalOpened.current
    ? 'today'
    : legalFrom === 'settings'
      ? 'settings'
      : legalFrom === 'idea'
        ? 'the idea'
        : 'back'
  const openLegal = (page: 'privacy' | 'terms' | 'questions', from: Screen) => {
    legalOpened.current = true
    setLegalFrom(from)
    setScreenValue(page)
  }
  const openSquareSettings = () => {
    setAfterSetup('settings')
    setScreenValue('setup')
  }

  const signOut = () => {
    goToday()
    setWhy(null)
    setLoaded(null)
    if (supabase) supabase.auth.signOut()
    else setDemoIn(false)
  }

  // Pinch: out walks the ladder outward (today → month → year → a life in years → months → days);
  // in enlarges the squares where there's more to read (month, a life in months or days), else steps in.
  const MONTH_NOTCHES = 2
  const LIFE_NOTCHES = 4
  const pinchIn = (at: Focal) => {
    if (screen === 'list') return listIn(listMid.current())
    else if (screen === 'month') {
      if (mag >= MONTH_NOTCHES - 1) return false
      const hit = document.elementsFromPoint(at.x, at.y).find((el) => (el as HTMLElement).dataset?.iso) as HTMLElement
      setMonthAnchor({ iso: hit?.dataset.iso, y: at.y })
      setMag(mag + 1)
    } else if (screen === 'year') goMonth()
    else if (screen === 'pie') {
      // On the pie, closer means fewer days counted: whole life → days I lived → painted only.
      const i = SCOPE_ORDER.indexOf(pieScope)
      if (i >= SCOPE_ORDER.length - 1) return false
      setPieScope(SCOPE_ORDER[i + 1])
    } else if (screen === 'life' && lifeRes === 'years') goYear()
    else if (screen === 'life') {
      if (mag >= LIFE_NOTCHES - 1) return false
      setFocal(at)
      setMag(mag + 1)
    } else return false
  }
  const pinchOut = (at: Focal) => {
    if (screen === 'today') outOfDay()
    else if (screen === 'list') return listOut(listMid.current())
    else if (screen === 'month') {
      if (mag === 0) return goYear()
      const hit = document.elementsFromPoint(at.x, at.y).find((el) => (el as HTMLElement).dataset?.iso) as HTMLElement
      setMonthAnchor({ iso: hit?.dataset.iso, y: at.y })
      setMag(mag - 1)
    } else if (screen === 'year') goLife()
    else if (screen === 'pie') {
      const i = SCOPE_ORDER.indexOf(pieScope)
      if (i <= 0) return false
      setPieScope(SCOPE_ORDER[i - 1])
    } else if (screen === 'life') {
      if (mag > 0) {
        setFocal(at)
        setMag(mag - 1)
      } else if (lifeRes === 'years') setLifeRes('months')
      else if (lifeRes === 'months') setLifeRes('days')
      else return false
    } else return false
  }

  pinchRef.current = { onIn: pinchIn, onOut: pinchOut }

  return (
    // Zoom levels fill exactly one screen (set here, not via the body attribute, so it applies on first paint).
    <ViewSwitch.Provider
      value={{ pie: screen === 'pie', toggle: togglePie, list: screen === 'list', toggleList, goToday }}
    >
      <div
        className={
          'app' +
          (screen === 'month' || screen === 'year' || screen === 'life' || screen === 'pie' || screen === 'list'
            ? ' is-one-screen'
            : '')
        }
      >
        {screen !== 'setup' &&
          screen !== 'welcome' &&
          screen !== 'settings' &&
          screen !== 'matters' &&
          screen !== 'account' &&
          screen !== 'privacy' &&
          screen !== 'terms' &&
          screen !== 'questions' &&
          screen !== 'export' && (
            <Topbar
              onHome={goToday}
              onCalendar={() => goMonth()}
              back={
                screen === 'month'
                  ? { label: todayIso().slice(0, 4), onBack: () => goYear() }
                  : screen === 'year'
                    ? { label: 'a life', onBack: goLife }
                    : undefined
              }
              onIdea={() => setScreen('idea')}
              onPaintings={() => setScreen('paintings')}
              onSettings={openSettings}
              onSignOut={signOut}
            />
          )}
        <div
          className={'stage' + (motion ? ` is-zoom-${motion}` : '')}
          key={screen === 'life' ? `life-${lifeRes}` : screen}
        >
          {screen === 'today' ? (
            <Today
              question={question}
              born={profile?.born}
              date={date}
              days={days}
              notes={notes[date] ?? []}
              loaded={loaded}
              why={why}
              nudge={nudge}
              onDate={(iso) => {
                setWhy(null)
                setDate(iso)
              }}
              onLoad={setLoaded}
              onDefine={() => setDefining(true)}
              onSaveNote={onSaveNote}
              onDeleteNote={onDeleteNote}
              onCloseWhy={() => setWhy(null)}
              onOpenWhy={(note) => setWhy({ note })}
              onDryBrush={onDryBrush}
              onFilled={onFilled}
              onWipe={onWipe}
              onFrame={onFrame}
              glimpse={
                date === todayIso() && glimpseIso
                  ? {
                      iso: glimpseIso,
                      day: days[glimpseIso],
                      note: (notes[glimpseIso] ?? []).find((n) => n.pinned) ?? notes[glimpseIso]?.at(-1),
                      ago: glimpseIso === monthsAgo(todayIso(), 12) ? 'a year ago today' : 'a month ago today',
                    }
                  : undefined
              }
              onPinNote={onPinNote}
              frameError={frameError}
              onZoomOut={outOfDay}
              onMatters={() => {
                setMattersFrom('today')
                setScreenValue('matters')
              }}
            />
          ) : screen === 'paintings' ? (
            <Paintings
              days={days}
              name={painter}
              onOpen={(m) => {
                setPaintedArrived(false)
                setPaintedMonth(m)
              }}
            />
          ) : screen === 'idea' ? (
            <About
              onMatters={() => {
                setMattersFrom('idea')
                setScreenValue('matters')
              }}
              onLegal={(page) => openLegal(page, 'idea')}
            />
          ) : screen === 'setup' && trySquares ? (
            <Setup profile={null} onBack={endTrySquares} onSave={async () => endTrySquares()} />
          ) : screen === 'setup' ? (
            <Setup
              profile={profile}
              onBack={() =>
                afterSetup === 'life'
                  ? setScreen('year')
                  : afterSetup === 'pie'
                    ? setScreen(pieFrom)
                    : afterSetup === 'settings'
                      ? setScreenValue('settings')
                      : goToday()
              }
              mode={afterSetup === 'settings' ? 'settings' : 'onboarding'}
              onSave={async (p) => {
                await saveProfile(p)
                setProfile(p)
                // First run ends on "start painting": straight to today's square.
                if (afterSetup === 'pie') setScreen('pie')
                else if (afterSetup !== 'settings') goToday()
              }}
            />
          ) : screen === 'welcome' ? (
            <Welcome
              tryOut={tryWelcome}
              onDone={() => {
                if (tryWelcome) history.replaceState(null, '', location.pathname)
                goToday()
              }}
            />
          ) : screen === 'settings' ? (
            <Settings
              profile={profile}
              onBack={() => setScreenValue(settingsFrom)}
              onSquares={openSquareSettings}
              onMatters={() => {
                setMattersFrom('settings')
                setScreenValue('matters')
              }}
              onAccount={() => setScreenValue('account')}
              onPrivacy={() => openLegal('privacy', 'settings')}
              onTerms={() => openLegal('terms', 'settings')}
              onExport={() => setScreenValue('export')}
            />
          ) : screen === 'export' ? (
            <Export
              onBack={() => setScreenValue('settings')}
              gather={async () => ({
                days,
                // Every note (the day screen loads them a month at a time); the demo has only what's on screen.
                notes: (await fetchAllNotes()) ?? (demo ? notes : legacyNotes(days)),
                matters: await syncMatters(loadMatters()).catch(() => loadMatters()),
                profile,
              })}
            />
          ) : screen === 'account' ? (
            <Account
              email={session?.user.email}
              onBack={() => setScreenValue('settings')}
              onSignOut={signOut}
              onDeleted={signOut}
            />
          ) : screen === 'privacy' ? (
            <Privacy onBack={closeLegal} backLabel={legalBack} />
          ) : screen === 'terms' ? (
            <Terms onBack={closeLegal} backLabel={legalBack} />
          ) : screen === 'questions' ? (
            <Questions onBack={closeLegal} backLabel={legalBack} />
          ) : screen === 'matters' ? (
            <WhatMatters
              onBack={() => setScreenValue(mattersFrom)}
              backLabel={mattersFrom === 'idea' ? 'the idea' : mattersFrom}
              onPaint={goToday}
              paintedToday={!!days[todayIso()]}
            />
          ) : screen === 'list' ? (
            listRes === 'days' ? (
              <DaysList
                key={`days-${listOnly}`}
                only={listOnly ?? undefined}
                onOnly={setListOnly}
                mid={listMid}
                head={listHead}
                days={days}
                notes={notes}
                born={profile?.born}
                focus={listFocus}
                onPick={(iso) => {
                  setDate(iso)
                  setDayFromList(true)
                  setScreen('today')
                }}
                onMonthShown={loadNotes}
                onPainting={(m) => {
                  setPaintedArrived(false)
                  setPaintedMonth(m)
                }}
                onIn={() => listIn(listMid.current())}
                onOut={() => listOut(listMid.current())}
              />
            ) : (
              <PeriodList
                key={listRes}
                res={listRes}
                mid={listMid}
                head={listHead}
                days={days}
                born={profile?.born}
                focus={listFocus}
                onOpen={(first) => listIn(first)}
                onIn={() => listIn(listMid.current())}
                onOut={listRes === 'months' ? () => listOut(listMid.current()) : undefined}
                onPainting={(p) => {
                  setPaintedArrived(false)
                  setPaintedMonth(p)
                }}
              />
            )
          ) : screen === 'pie' && profile ? (
            <Pie
              days={days}
              profile={profile}
              scope={pieScope}
              onScope={setPieScope}
              onSee={(id) => {
                // The slice's days, in the list; its squares icon goes back to where the pie was opened from.
                setListFrom(pieFrom)
                setListRes('days')
                setListZoomed(false)
                setListFocus(todayIso())
                setListOnly(id === 'lived' ? null : id)
                setScreen('list')
              }}
            />
          ) : screen === 'year' ? (
            <Year
              days={days}
              born={profile?.born}
              focus={yearFocus}
              onPick={(m) => goMonth(m)}
              onIn={() => goMonth()}
              onOut={goLife}
              onPainting={(p) => {
                setPaintedArrived(false)
                setPaintedMonth(p)
              }}
            />
          ) : screen === 'life' && profile ? (
            lifeRes === 'days' ? (
              <LifeDays
                days={days}
                profile={profile}
                onPick={(iso) => {
                  setDate(iso)
                  setScreen('today')
                }}
                onIn={() => setLifeRes('months')}
                onResolution={setLifeRes}
                cols={[28, 14, 7, 3][mag]}
                focal={focal}
              />
            ) : lifeRes === 'months' ? (
              <LifeMonths
                days={days}
                profile={profile}
                onPick={(m) => goMonth(m)}
                onIn={() => setLifeRes('years')}
                onOut={() => setLifeRes('days')}
                onResolution={setLifeRes}
                cols={[12, 6, 4, 3][mag]}
                focal={focal}
              />
            ) : (
              <Life
                days={days}
                profile={profile}
                onPick={(y) => goYear(y)}
                onIn={() => goYear()}
                onOut={() => setLifeRes('months')}
                onResolution={setLifeRes}
              />
            )
          ) : (
            <Month
              days={days}
              born={profile?.born}
              focus={monthFocus}
              onPick={(iso) => {
                setDate(iso)
                setScreen('today')
              }}
              onIn={goToday}
              onOut={() => goYear()}
              zoomed={mag > 0}
              anchor={monthAnchor}
              onPainting={(m) => {
                setPaintedArrived(false)
                setPaintedMonth(m)
              }}
            />
          )}
        </div>
        <MeaningSheet open={defining} onClose={() => setDefining(false)} />
        {(['today', 'month', 'year', 'list', 'paintings'] as Screen[]).includes(screen) && (
          <MonthPainting
            month={paintedMonth}
            arrived={paintedArrived}
            days={days}
            name={painter}
            onClose={() => setPaintedMonth(null)}
          />
        )}
      </div>
    </ViewSwitch.Provider>
  )
}
