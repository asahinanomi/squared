import { useCallback, useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { MeaningSheet } from './components/MeaningSheet'
import { Topbar } from './components/Topbar'
import { QUESTION } from './lib/config'
import { todayIso } from './lib/dates'
import { fetchMonth, saveColor, type Days } from './lib/days'
import { mockDays } from './lib/mock'
import { addNote, deleteNote, fetchMonthNotes, legacyNotes, replaceNote, type Note, type Notes } from './lib/notes'
import type { Paint } from './lib/paints'
import { fetchQuestion, finishSignIn, signInWithGoogle, supabase } from './lib/supabase'
import { Calendar } from './screens/Calendar'
import { Idea } from './screens/Idea'
import { SignIn } from './screens/SignIn'
import { Today } from './screens/Today'
import './App.css'

type Screen = 'today' | 'calendar' | 'idea'

const byTime = (a: Note, b: Note) => a.writtenAt.localeCompare(b.writtenAt)

// Without Supabase env vars the app runs as a local demo: no sign-in, fake days, nothing saved.
const demo = !supabase

export default function App() {
  // undefined = still checking; null = signed out.
  const [session, setSession] = useState<Session | null | undefined>(demo ? null : undefined)
  const [demoIn, setDemoIn] = useState(false)
  const [authError, setAuthError] = useState<string | null>(null)
  const [question, setQuestion] = useState(QUESTION)
  const [screen, setScreen] = useState<Screen>('today')
  const [date, setDate] = useState(todayIso)
  const [days, setDays] = useState<Days>(() => (demo ? mockDays() : {}))
  const [loaded, setLoaded] = useState<Paint | null>(null)
  const [defining, setDefining] = useState(false)
  const [notes, setNotes] = useState<Notes>({})
  // The open "why?" bubble: a new note ({}), or an existing note being edited.
  const [why, setWhy] = useState<{ note?: Note } | null>(null)
  const [nudge, setNudge] = useState(false)

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

  // Load the question, this month's squares and notes for whoever is signed in.
  useEffect(() => {
    if (!userId) {
      if (!demo) {
        setDays({})
        setNotes({})
      }
      return
    }
    fetchQuestion().then((q) => q && setQuestion(q))
    Promise.all([fetchMonth(todayIso()), fetchMonthNotes(todayIso())])
      .then(([d, n]) => {
        setDays(d)
        setNotes(n ?? legacyNotes(d))
      })
      .catch((e) => console.error('Could not load days', e))
  }, [userId])

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
        return { ...d, [date]: { ...d[date], color } }
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

  // Notes save first, then close: the bubble waits, and keeps the text if saving fails.
  const putNotes = (day: string, fn: (list: Note[]) => Note[]) =>
    setNotes((all) => ({ ...all, [day]: fn(all[day] ?? []).sort(byTime) }))

  const failure = (e: unknown, verb: string) => {
    console.error(`Could not ${verb} note`, e)
    const code = (e as { code?: string })?.code
    return new Error(
      code === 'PGRST205' || code === '42P01'
        ? `couldn't ${verb}: the notes update (0004) hasn't been run in Supabase yet`
        : `couldn't ${verb}, check your connection and try again`,
    )
  }

  const onSaveNote = async (note: Note | undefined, text: string) => {
    try {
      if (note) {
        const saved = await replaceNote(note, text)
        putNotes(note.date, (l) => l.map((n) => (n.id === note.id ? saved : n)))
      } else {
        const day = date
        const saved = await addNote(day, text)
        putNotes(day, (l) => [...l, saved])
      }
      setWhy(null)
    } catch (e) {
      throw failure(e, 'save')
    }
  }

  const onDeleteNote = async (note: Note) => {
    try {
      await deleteNote(note)
      putNotes(note.date, (l) => l.filter((n) => n.id !== note.id))
      setWhy(null)
    } catch (e) {
      throw failure(e, 'delete')
    }
  }

  const onDryBrush = () => {
    setNudge(true)
    setTimeout(() => setNudge(false), 750)
  }

  if (session === undefined) return null
  if (!signedIn) return <SignIn error={authError} onSignIn={demo ? () => setDemoIn(true) : signInWithGoogle} />

  const goToday = () => {
    setDate(todayIso())
    setScreen('today')
  }

  const signOut = () => {
    goToday()
    setWhy(null)
    setLoaded(null)
    if (supabase) supabase.auth.signOut()
    else setDemoIn(false)
  }

  return (
    <div className="app">
      <Topbar
        onHome={goToday}
        onCalendar={() => setScreen('calendar')}
        onIdea={() => setScreen('idea')}
        onSignOut={signOut}
      />
      {screen === 'today' ? (
        <Today
          question={question}
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
        />
      ) : screen === 'idea' ? (
        <Idea />
      ) : (
        <Calendar
          days={days}
          onPick={(iso) => {
            setDate(iso)
            setScreen('today')
          }}
        />
      )}
      <MeaningSheet open={defining} onClose={() => setDefining(false)} />
    </div>
  )
}
