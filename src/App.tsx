import { useEffect, useState } from 'react'
import { DayFinder } from './components/DayFinder'
import { MeaningSheet } from './components/MeaningSheet'
import { MonthPainting } from './components/MonthPainting'
import { OpenPainting } from './components/PaintingButton'
import { SyncStatus } from './components/SyncStatus'
import { Topbar } from './components/Topbar'
import { Waiting } from './components/Waiting'
import { ViewSwitch } from './components/ZoomBar'
import type { Why } from './lib/notes'
import type { Paint } from './lib/paints'
import { todayIso } from './lib/dates'
import { backFromGoogle, supabase } from './lib/supabase'
import { Screens } from './Screens'
import { SignedOut } from './screens/SignedOut'
import { demo, NO_TOPBAR, PAGES, type Screen } from './state/app'
import { useAccount } from './state/useAccount'
import { useAuth } from './state/useAuth'
import { useBrowserHistory } from './state/useBrowserHistory'
import { useDayActions } from './state/useDayActions'
import { useKept } from './state/useKept'
import { useLanding } from './state/useLanding'
import { useLock } from './state/useLock'
import { useMatters } from './state/useMatters'
import { useNavigation } from './state/useNavigation'
import { usePaintingArrival } from './state/usePaintingArrival'
import './App.css'

// The app, put together: who's signed in, what the account holds, where you are, and what's on screen. Each piece
// lives in its own file under src/state (and the screens in Screens.tsx); this file only wires them up.
export default function App() {
  const { session, userId, signedIn, painter, authError, setDemoIn } = useAuth()
  const acc = useAccount(userId)

  // What's open on the day: the "why?" bubble (a new note, or one being edited), the brush's paint, the nudge.
  const [why, setWhy] = useState<Why | null>(null)
  const [loaded, setLoaded] = useState<Paint | null>(null)
  const [nudge, setNudge] = useState(false)
  const [defining, setDefining] = useState(false)
  // The day finder from home ("paint another day") or the menu ("find a day"): pick a day, land on it to paint.
  const [finding, setFinding] = useState(false)
  const onDryBrush = () => {
    setNudge(true)
    setTimeout(() => setNudge(false), 750)
  }

  const nav = useNavigation(acc.profile, setWhy, signedIn)
  const { screen, date } = nav
  const act = useDayActions(date, acc, why, setWhy)
  const lists = useMatters(userId, screen)
  const wall = useKept(session)
  const painting = usePaintingArrival(acc.days, !!userId && acc.checking)

  // Notes load a month at a time: the day you're on.
  const { loadNotes } = acc
  useEffect(() => loadNotes(date), [loadNotes, date])

  // Settings and its pages open at their top (a link at the foot of settings kept its scroll).
  useEffect(() => {
    if (PAGES.includes(screen)) window.scrollTo(0, 0)
  }, [screen])
  useEffect(() => {
    document.body.dataset.screen = document.documentElement.dataset.screen = signedIn ? screen : 'signin'
  }, [signedIn, screen])

  const signOut = () => {
    nav.goToday()
    setWhy(null)
    setLoaded(null)
    if (supabase) supabase.auth.signOut()
    else setDemoIn(false)
  }
  // Lock when I leave: away longer than you chose, squared signs out (settings → lock when I leave). Never during
  // onboarding: nothing private is there yet, and signing out would lose what was typed.
  useLock(signedIn && screen !== 'welcome', signOut)

  const landed = useLanding(signedIn, acc, nav)
  useBrowserHistory(signedIn, nav, () => setWhy(null))

  // Your squares couldn't load: say so, rather than showing an empty life in its place.
  if (acc.loadFailed && userId)
    return (
      <main className="load-failed">
        <p>Couldn't load your squares. Check your connection.</p>
        <button className="pill" onClick={() => location.reload()}>
          try again
        </button>
      </main>
    )
  if (session === undefined || (userId && acc.checking) || (signedIn && !landed && screen === 'today'))
    return session === undefined && backFromGoogle ? (
      <Waiting line="signing you in with Google…" later="still signing you in, a slow connection can take a moment" />
    ) : (
      <Waiting />
    )
  if (!signedIn) return <SignedOut error={authError} onDemoSignIn={() => setDemoIn(true)} />

  const oneScreen = ['month', 'year', 'life', 'pie', 'list'].includes(screen)
  const withPainting: Screen[] = ['home', 'today', 'month', 'year', 'life', 'list', 'paintings', 'mydays']

  return (
    <ViewSwitch.Provider
      value={{
        list: screen === 'list',
        toggleList: nav.toggleList,
        goToday: nav.goToday,
      }}
    >
      <OpenPainting.Provider value={painting.paintedMonth}>
        {/* Zoom levels fill exactly one screen (set here, not via the body attribute, so it applies on first paint). */}
        <div className={'app' + (oneScreen ? ' is-one-screen' : '')}>
          {!NO_TOPBAR.includes(screen) && !(screen === 'setup' && nav.afterSetup !== 'settings') && (
            <Topbar
              onHome={nav.goHome}
              onToday={nav.goToday}
              onCalendar={nav.openMyDays}
              onIdea={() => nav.setScreen('idea')}
              onSettings={nav.openSettings}
              onSignOut={signOut}
            />
          )}
          <div
            className={'stage' + (nav.motion ? ` is-zoom-${nav.motion}` : '')}
            key={screen === 'life' ? `life-${nav.lifeRes}` : screen}
          >
            <Screens
              nav={nav}
              acc={acc}
              act={act}
              lists={lists}
              wall={wall}
              openPainting={painting.openPainting}
              painter={painter}
              signOut={signOut}
              ui={{
                why,
                setWhy,
                loaded,
                setLoaded,
                nudge,
                onDryBrush,
                onDefine: () => setDefining(true),
                onFind: () => setFinding(true),
              }}
            />
          </div>
          <MeaningSheet open={defining} onClose={() => setDefining(false)} />
          <DayFinder
            open={finding}
            onClose={() => setFinding(false)}
            date={todayIso()}
            today={todayIso()}
            born={acc.profile?.born}
            days={acc.days}
            onPick={(iso) => {
              setFinding(false)
              setWhy(null)
              nav.openDay(iso)
            }}
          />
          {withPainting.includes(screen) && (
            <MonthPainting
              month={painting.paintedMonth}
              arrived={painting.paintedArrived}
              days={acc.days}
              name={painter}
              onClose={painting.closePainting}
              onKeep={wall.keep}
              kept={!!painting.paintedMonth && wall.kept.includes(painting.paintedMonth)}
            />
          )}
          {!demo && <SyncStatus />}
        </div>
      </OpenPainting.Provider>
    </ViewSwitch.Provider>
  )
}
