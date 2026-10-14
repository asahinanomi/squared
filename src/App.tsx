import { useCallback, useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { MeaningSheet } from './components/MeaningSheet'
import { Topbar } from './components/Topbar'
import { QUESTION } from './lib/config'
import { todayIso } from './lib/dates'
import { mockDays, type Day } from './lib/mock'
import type { Paint } from './lib/paints'
import { fetchQuestion, signInWithGoogle, supabase } from './lib/supabase'
import { Calendar } from './screens/Calendar'
import { SignIn } from './screens/SignIn'
import { Today } from './screens/Today'
import './App.css'

type Screen = 'today' | 'calendar'

// Step 2 preview: open with ?why to see the why bubble on a painted square.
const previewWhy = new URLSearchParams(location.search).has('why')

export default function App() {
  // undefined = still checking; null = signed out. Without Supabase env vars the app runs as a local demo.
  const [session, setSession] = useState<Session | null | undefined>(supabase ? undefined : null)
  const [demoIn, setDemoIn] = useState(previewWhy)
  const [question, setQuestion] = useState(QUESTION)
  const [screen, setScreen] = useState<Screen>('today')
  const [date, setDate] = useState(todayIso)
  const [days, setDays] = useState<Record<string, Day>>(() =>
    previewWhy ? { ...mockDays(), [todayIso()]: { color: 'green' } } : mockDays(),
  )
  const [loaded, setLoaded] = useState<Paint | null>(previewWhy ? 'green' : null)
  const [defining, setDefining] = useState(false)
  const [asking, setAsking] = useState(previewWhy)
  const [nudge, setNudge] = useState(false)

  const onFilled = useCallback(
    (color: Paint) => {
      setDays((d) => ({ ...d, [date]: { ...d[date], color } }))
      setAsking(true)
    },
    [date],
  )

  const onDryBrush = () => {
    setNudge(true)
    setTimeout(() => setNudge(false), 520)
  }

  useEffect(() => {
    if (!supabase) return
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setSession(s))
    return () => data.subscription.unsubscribe()
  }, [])

  const signedIn = supabase ? !!session : demoIn
  const userId = session?.user.id

  useEffect(() => {
    if (userId) fetchQuestion().then((q) => q && setQuestion(q))
  }, [userId])

  useEffect(() => {
    document.body.dataset.screen = signedIn ? screen : 'signin'
  }, [signedIn, screen])

  if (session === undefined) return null
  if (!signedIn) return <SignIn onSignIn={supabase ? signInWithGoogle : () => setDemoIn(true)} />

  const signOut = () => {
    setScreen('today')
    setDate(todayIso())
    if (supabase) supabase.auth.signOut()
    else setDemoIn(false)
  }

  const saveNote = (note: string) => {
    setAsking(false)
    setDays((d) => (d[date] ? { ...d, [date]: { ...d[date], note: note || undefined } } : d))
  }

  return (
    <div className="app">
      <Topbar
        onHome={() => {
          setDate(todayIso())
          setScreen('today')
        }}
        onCalendar={() => setScreen('calendar')}
        onSignOut={signOut}
      />
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
          onWhyDone={saveNote}
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
