import { useCallback, useEffect, useState } from 'react'
import { MeaningSheet } from './components/MeaningSheet'
import { Topbar } from './components/Topbar'
import { QUESTION } from './lib/config'
import { todayIso } from './lib/dates'
import { mockDays, type Day } from './lib/mock'
import type { Paint } from './lib/paints'
import { Calendar } from './screens/Calendar'
import { SignIn } from './screens/SignIn'
import { Today } from './screens/Today'
import './App.css'

type Screen = 'signin' | 'today' | 'calendar'

// Step 2 preview: open with ?why to see the why bubble on a painted square.
const previewWhy = new URLSearchParams(location.search).has('why')

export default function App() {
  const [screen, setScreen] = useState<Screen>(previewWhy ? 'today' : 'signin')
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
    document.body.dataset.screen = screen
  }, [screen])

  if (screen === 'signin') return <SignIn onSignIn={() => setScreen('today')} />

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
        onSignOut={() => setScreen('signin')}
      />
      {screen === 'today' ? (
        <Today
          question={QUESTION}
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
