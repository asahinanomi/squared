import { useCallback, useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { MeaningSheet } from './components/MeaningSheet'
import { Topbar } from './components/Topbar'
import { QUESTION } from './lib/config'
import { todayIso } from './lib/dates'
import { fetchMonth, saveColor, type Days } from './lib/days'
import { mockDays } from './lib/mock'
import { addNote, deleteNote, draftNote, fetchMonthNotes, legacyNotes, replaceNote, type Note, type Notes, type Why } from './lib/notes'
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
  const [why, setWhy] = useState<Why | null>(null)
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
      swap(note.date, note.id, { ...note, body: text, writtenAt: new Date().toISOString() })
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
