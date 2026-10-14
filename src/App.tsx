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
import { SignIn } from './screens/SignIn'
import { Today } from './screens/Today'
import './App.css'

type Screen = 'today' | 'calendar'

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

  // Notes are optimistic too: shown at once, saved in the background, undone if saving fails.
  const putNotes = (day: string, fn: (list: Note[]) => Note[]) =>
    setNotes((all) => ({ ...all, [day]: fn(all[day] ?? []) }))

  const onAddNote = (text: string) => {
    setWhy(null)
    if (!text) return
    const day = date
    const temp: Note = { id: `pending-${Date.now()}`, date: day, body: text, writtenAt: new Date().toISOString() }
    putNotes(day, (l) => [...l, temp])
    addNote(day, text)
      .then((saved) => putNotes(day, (l) => l.map((n) => (n.id === temp.id ? saved : n))))
      .catch((e) => {
        console.error('Could not save note', e)
        putNotes(day, (l) => l.filter((n) => n.id !== temp.id))
      })
  }

  // Replace overwrites that note (clearing it removes it); its time becomes now.
  const onReplaceNote = (note: Note, text: string) => {
    setWhy(null)
    if (text === note.body) return
    const restore = () => putNotes(note.date, (l) => [...l.filter((n) => n.id !== note.id), note].sort(byTime))
    if (!text) {
      putNotes(note.date, (l) => l.filter((n) => n.id !== note.id))
      deleteNote(note).catch((e) => {
        console.error('Could not remove note', e)
        restore()
      })
      return
    }
    const draft = { ...note, body: text, writtenAt: new Date().toISOString() }
    putNotes(note.date, (l) => [...l.filter((n) => n.id !== note.id), draft].sort(byTime))
    replaceNote(note, text)
      .then((saved) => putNotes(note.date, (l) => l.map((n) => (n.id === note.id ? saved : n)).sort(byTime)))
      .catch((e) => {
        console.error('Could not replace note', e)
        restore()
      })
  }

  const onDryBrush = () => {
    setNudge(true)
    setTimeout(() => setNudge(false), 520)
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
      <Topbar onHome={goToday} onCalendar={() => setScreen('calendar')} onSignOut={signOut} />
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
          onAddNote={onAddNote}
          onReplaceNote={onReplaceNote}
          onCloseWhy={() => setWhy(null)}
          onOpenWhy={(note) => setWhy({ note })}
          onDryBrush={onDryBrush}
          onFilled={onFilled}
        />
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
