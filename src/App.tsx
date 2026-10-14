import { useCallback, useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { MeaningSheet } from './components/MeaningSheet'
import { Topbar } from './components/Topbar'
import { QUESTION } from './lib/config'
import { todayIso } from './lib/dates'
import { fetchMonth, saveColor, saveNote, type Days } from './lib/days'
import { mockDays } from './lib/mock'
import type { Paint } from './lib/paints'
import { fetchQuestion, finishSignIn, signInWithGoogle, supabase } from './lib/supabase'
import { Calendar } from './screens/Calendar'
import { SignIn } from './screens/SignIn'
import { Today } from './screens/Today'
import './App.css'

type Screen = 'today' | 'calendar'

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
  const [asking, setAsking] = useState(false)
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

  // Load the question and this month's squares for whoever is signed in.
  useEffect(() => {
    if (!userId) {
      if (!demo) setDays({})
      return
    }
    fetchQuestion().then((q) => q && setQuestion(q))
    fetchMonth(todayIso())
      .then(setDays)
      .catch((e) => console.error('Could not load days', e))
  }, [userId])

  useEffect(() => {
    document.body.dataset.screen = document.documentElement.dataset.screen = signedIn ? screen : 'signin'
  }, [signedIn, screen])

  // Optimistic: show the paint at once, save in the background, roll back if it fails.
  const onFilled = useCallback(
    (color: Paint) => {
      setAsking(true)
      let before: Days[string]
      setDays((d) => {
        before = d[date]
        return { ...d, [date]: { ...d[date], color } }
      })
      saveColor(date, color).catch((e) => {
        console.error('Could not save color', e)
        setAsking(false)
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

  const onWhyDone = (text: string) => {
    setAsking(false)
    const note = text || undefined
    const day = days[date]
    if (!day || day.note === note) return
    const noteAt = note ? new Date().toISOString() : undefined
    setDays((d) => ({ ...d, [date]: { ...d[date], note, noteAt } }))
    saveNote(date, note ?? null).catch((e) => {
      console.error('Could not save note', e)
      setDays((d) => ({ ...d, [date]: { ...d[date], note: day.note, noteAt: day.noteAt } }))
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
    setAsking(false)
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
          loaded={loaded}
          showWhy={asking}
          nudge={nudge}
          onDate={(iso) => {
            setAsking(false)
            setDate(iso)
          }}
          onLoad={setLoaded}
          onDefine={() => setDefining(true)}
          onWhyDone={onWhyDone}
          onEditNote={() => setAsking(true)}
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
