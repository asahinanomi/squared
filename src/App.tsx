import { useCallback, useEffect, useRef, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { MeaningSheet } from './components/MeaningSheet'
import { Topbar } from './components/Topbar'
import { QUESTION } from './lib/config'
import { todayIso } from './lib/dates'
import { fetchAllDays, saveColor, type Days } from './lib/days'
import { mockDays } from './lib/mock'
import {
  addNote,
  deleteNote,
  draftNote,
  fetchMonthNotes,
  legacyNotes,
  replaceNote,
  type Note,
  type Notes,
  type Why,
} from './lib/notes'
import type { Paint } from './lib/paints'
import { fetchProfile, saveProfile, type Profile } from './lib/profile'
import { fetchQuestion, finishSignIn, signInWithGoogle, supabase } from './lib/supabase'
import { Idea } from './screens/Idea'
import { Month } from './screens/Month'
import { Year } from './screens/Year'
import { Setup } from './screens/Setup'
import { SignIn } from './screens/SignIn'
import { Today } from './screens/Today'
import './App.css'

type Screen = 'today' | 'month' | 'year' | 'idea' | 'setup'
/** The zoom ladder, closest first. Zooming out always lands on (and centres) today. */
const LADDER: Screen[] = ['today', 'month', 'year']

const byTime = (a: Note, b: Note) => a.writtenAt.localeCompare(b.writtenAt)

// Without Supabase env vars the app runs as a local demo: no sign-in, fake days, nothing saved.
const demo = !supabase

export default function App() {
  // undefined = still checking; null = signed out.
  const [session, setSession] = useState<Session | null | undefined>(demo ? null : undefined)
  const [demoIn, setDemoIn] = useState(false)
  const [authError, setAuthError] = useState<string | null>(null)
  const [question, setQuestion] = useState(QUESTION)
  const [screen, setScreenValue] = useState<Screen>('today')
  // Which way the last move went, so the new level can zoom in or out into place.
  const [motion, setMotion] = useState<'in' | 'out' | null>(null)
  // The month to open on when zooming in from a year (zooming out always lands on today's).
  const [monthFocus, setMonthFocus] = useState<string | undefined>()
  const [date, setDate] = useState(todayIso)
  const [days, setDays] = useState<Days>(() => (demo ? mockDays() : {}))
  const [loaded, setLoaded] = useState<Paint | null>(null)
  const [defining, setDefining] = useState(false)
  const [notes, setNotes] = useState<Notes>({})
  // The open "why?" bubble: a new note ({}), or an existing note being edited.
  const [why, setWhy] = useState<Why | null>(null)
  const [nudge, setNudge] = useState(false)
  const [profile, setProfile] = useState<Profile | null>(null)

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
      })
      .catch((e) => console.error('Could not load days', e))
  }, [userId])

  // Notes load a month at a time, as you visit days in it.
  const notesLoaded = useRef(new Set<string>())
  useEffect(() => {
    const m = date.slice(0, 7)
    if (!userId || notesLoaded.current.has(m)) return
    notesLoaded.current.add(m)
    fetchMonthNotes(date)
      .then((n) => n && setNotes((all) => ({ ...all, ...n })))
      .catch((e) => {
        notesLoaded.current.delete(m)
        console.error('Could not load notes', e)
      })
  }, [userId, date])

  useEffect(() => {
    document.body.dataset.screen = document.documentElement.dataset.screen = signedIn ? screen : 'signin'
  }, [signedIn, screen])

  // Optimistic: show the paint at once, save in the background, roll back if it fails.
  const onFilled = useCallback(
    (color: Paint) => {
      setWhy({})
      let before: Days[string]
      setDays((d) => {
        before = d[date]
        // A first paint counts as backfilled unless it's today's (the database decides for good).
        return {
          ...d,
          [date]: { backfilled: date !== todayIso(), ...d[date], color },
        }
      })
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
      const draft = draftNote(date, text)
      putNotes(draft.date, (l) => [...l, draft])
      try {
        swap(draft.date, draft.id, await addNote(draft))
      } catch (e) {
        putNotes(draft.date, (l) => l.filter((n) => n.id !== draft.id))
        reopen(draft.date, { draft: text, error: failure(e, 'save') })
      }
    }
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

  if (session === undefined) return null
  if (!signedIn) return <SignIn error={authError} onSignIn={demo ? () => setDemoIn(true) : signInWithGoogle} />

  const setScreen = (next: Screen) => {
    const a = LADDER.indexOf(screen)
    const b = LADDER.indexOf(next)
    setMotion(a < 0 || b < 0 || a === b ? null : b > a ? 'out' : 'in')
    setScreenValue(next)
  }

  const goToday = () => {
    setDate(todayIso())
    setScreen('today')
  }

  // Zoom out from the square: the month, always the current one.
  const goMonth = (focus?: string) => {
    setWhy(null)
    setMonthFocus(focus)
    setScreen('month')
  }
  const goYear = () => setScreen('year')

  const signOut = () => {
    goToday()
    setWhy(null)
    setLoaded(null)
    if (supabase) supabase.auth.signOut()
    else setDemoIn(false)
  }

  return (
    // Zoom levels fill exactly one screen (set here, not via the body attribute, so it applies on first paint).
    <div className={'app' + (screen === 'month' || screen === 'year' ? ' is-one-screen' : '')}>
      {screen !== 'setup' && (
        <Topbar
          onHome={goToday}
          onCalendar={() => goMonth()}
          back={screen === 'month' ? { label: todayIso().slice(0, 4), onBack: goYear } : undefined}
          onIdea={() => setScreen('idea')}
          onSetup={() => setScreen('setup')}
          onSignOut={signOut}
        />
      )}
      <div className={'stage' + (motion ? ` is-zoom-${motion}` : '')} key={screen}>
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
            onZoomOut={() => goMonth()}
          />
        ) : screen === 'idea' ? (
          <Idea />
        ) : screen === 'setup' ? (
          <Setup
            profile={profile}
            onBack={goToday}
            onSave={async (p) => {
              await saveProfile(p)
              setProfile(p)
              goToday()
            }}
          />
        ) : screen === 'year' ? (
          <Year days={days} born={profile?.born} onPick={(m) => goMonth(m)} onIn={() => goMonth()} />
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
            onOut={goYear}
          />
        )}
      </div>
      <MeaningSheet open={defining} onClose={() => setDefining(false)} />
    </div>
  )
}
