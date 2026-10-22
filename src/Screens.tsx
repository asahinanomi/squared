import { LifeHead } from './components/LifeHead'
import { todayIso } from './lib/dates'
import { fetchMatters } from './lib/matters'
import { fetchAllNotes, legacyNotes, type Why } from './lib/notes'
import type { Paint } from './lib/paints'
import { saveProfile } from './lib/profile'
import { About } from './screens/About'
import { DaysList } from './screens/DaysList'
import { Export } from './screens/Export'
import { Home } from './screens/Home'
import { Life } from './screens/Life'
import { LifeDays } from './screens/LifeDays'
import { LifeMonths } from './screens/LifeMonths'
import { Month } from './screens/Month'
import { Paintings } from './screens/Paintings'
import { PeriodList } from './screens/PeriodList'
import { Pie } from './screens/Pie'
import { Privacy } from './screens/Privacy'
import { Questions } from './screens/Questions'
import { Settings } from './screens/Settings'
import { Setup } from './screens/Setup'
import { Terms } from './screens/Terms'
import { Today } from './screens/Today'
import { Welcome } from './screens/Welcome'
import { WhatMatters } from './screens/WhatMatters'
import { Year } from './screens/Year'
import { demo, tryWelcome } from './state/app'
import type { Account } from './state/useAccount'
import type { useDayActions } from './state/useDayActions'
import type { useKept } from './state/useKept'
import type { useMatters } from './state/useMatters'
import type { Navigation } from './state/useNavigation'

export type ScreensProps = {
  nav: Navigation
  acc: Account
  act: ReturnType<typeof useDayActions>
  lists: ReturnType<typeof useMatters>
  wall: ReturnType<typeof useKept>
  openPainting: (p: string) => void
  painter: string
  email?: string
  signOut: () => void
  ui: {
    why: Why | null
    setWhy: (w: Why | null) => void
    loaded: Paint | null
    setLoaded: (p: Paint | null) => void
    nudge: boolean
    onDryBrush: () => void
    onDefine: () => void
  }
}

// Which screen shows, and what each one is given. Every screen gets what it needs from the app's pieces (the
// navigation, the account's data, the day's actions, what matters, my paintings); nothing here keeps state.
export function Screens({ nav, acc, act, lists, wall, openPainting, painter, email, signOut, ui }: ScreensProps) {
  const { screen, setScreenValue, date, mag, focal, lifeRes, setLifeRes, listRes, listMid } = nav
  const { days, notes, profile } = acc

  if (screen === 'home')
    return (
      <Home
        name={painter}
        days={days}
        notes={notes}
        profile={profile}
        steps={[
          { label: 'learned what squared is', done: true, go: nav.goToday },
          { label: 'named what matters', done: lists.mattersWritten, go: () => nav.openMatters('home') },
          { label: 'set how many squares', done: !!profile, go: () => nav.askSquares('home') },
          { label: 'paint your first square', done: Object.keys(days).length > 0, go: nav.goToday },
        ]}
        onToday={nav.goToday}
        onLife={nav.goLifeDays}
        onDay={(iso) => nav.openDay(iso)}
        onPainting={openPainting}
      />
    )
  if (screen === 'today')
    return (
      <Today
        matters={lists.matters}
        question={acc.question}
        born={profile?.born}
        date={date}
        days={days}
        notes={notes[date] ?? []}
        loaded={ui.loaded}
        why={ui.why}
        nudge={ui.nudge}
        onDate={(iso) => {
          ui.setWhy(null)
          nav.setDate(iso)
        }}
        onLoad={ui.setLoaded}
        onDefine={ui.onDefine}
        onSaveNote={act.onSaveNote}
        onDeleteNote={act.onDeleteNote}
        onCloseWhy={() => ui.setWhy(null)}
        onOpenWhy={(note) => ui.setWhy({ note })}
        onDryBrush={ui.onDryBrush}
        onFilled={act.onFilled}
        onWipe={act.onWipe}
        onFrame={act.onFrame}
        onPinNote={act.onPinNote}
        onZoomOut={nav.outOfDay}
        onMatters={() => nav.openMatters('today')}
      />
    )
  if (screen === 'paintings')
    return (
      <Paintings
        kept={wall.kept}
        days={days}
        name={painter}
        onBack={() => setScreenValue('settings')}
        onRemove={wall.remove}
        onOpen={openPainting}
      />
    )
  if (screen === 'idea')
    return <About onMatters={() => nav.openMatters('idea')} onLegal={(page) => nav.openLegal(page, 'idea')} />
  if (screen === 'setup' && nav.trySquares)
    return <Setup profile={null} onBack={nav.endTrySquares} onSave={async () => nav.endTrySquares()} />
  if (screen === 'setup')
    return (
      <Setup
        profile={profile}
        onBack={nav.leaveSetup}
        mode={nav.afterSetup === 'settings' ? 'settings' : 'onboarding'}
        onSave={async (p) => {
          await saveProfile(p)
          acc.setProfile(p)
          nav.afterSquares()
        }}
      />
    )
  if (screen === 'welcome')
    return (
      <Welcome
        tryOut={tryWelcome}
        onSquares={async (p) => {
          await saveProfile(p)
          acc.setProfile(p)
        }}
        onMatters={lists.addLines}
        onDone={() => {
          if (tryWelcome) history.replaceState(null, '', location.pathname)
          nav.goToday() // the first square, with the ghost brush showing how
        }}
      />
    )
  if (screen === 'settings')
    return (
      <Settings
        profile={profile}
        onBack={() => setScreenValue(nav.settingsFrom)}
        onSquares={() => nav.askSquares('settings')}
        onMatters={() => nav.openMatters('settings')}
        email={email}
        onSignOut={signOut}
        onDeleted={signOut}
        onPrivacy={() => nav.openLegal('privacy', 'settings')}
        onTerms={() => nav.openLegal('terms', 'settings')}
        onExport={() => setScreenValue('export')}
        onPaintings={() => setScreenValue('paintings')}
      />
    )
  if (screen === 'export')
    return (
      <Export
        onBack={() => setScreenValue('settings')}
        gather={async () => ({
          days,
          // Every note (the day screen loads them a month at a time); the demo has only what's on screen.
          notes: (await fetchAllNotes()) ?? (demo ? notes : legacyNotes(days)),
          matters: await fetchMatters().catch(() => lists.matters),
          profile,
        })}
      />
    )
  if (screen === 'privacy') return <Privacy onBack={nav.closeLegal} backLabel={nav.legalBack} />
  if (screen === 'terms') return <Terms onBack={nav.closeLegal} backLabel={nav.legalBack} />
  if (screen === 'questions') return <Questions onBack={nav.closeLegal} backLabel={nav.legalBack} />
  if (screen === 'matters')
    return (
      <WhatMatters
        onBack={() => setScreenValue(nav.mattersFrom)}
        backLabel={nav.mattersFrom === 'idea' ? 'the idea' : nav.mattersFrom}
        onPaint={nav.goToday}
        paintedToday={!!days[todayIso()]}
        initial={lists.matters}
        onSaved={lists.setMatters}
      />
    )
  if (screen === 'list') {
    const head = profile && <LifeHead profile={profile} current={listRes} onPick={nav.listTo} />
    return listRes === 'days' ? (
      <DaysList
        key={`days-${nav.listOnly}`}
        only={nav.listOnly ?? undefined}
        onOnly={nav.setListOnly}
        mid={listMid}
        head={head}
        days={days}
        notes={notes}
        born={profile?.born}
        focus={nav.listFocus}
        onPick={(iso) => nav.openDay(iso, true)}
        onMonthShown={acc.loadNotes}
        onPainting={openPainting}
        onIn={() => nav.listIn(listMid.current())}
        onOut={() => nav.listOut(listMid.current())}
      />
    ) : (
      <PeriodList
        key={listRes}
        res={listRes}
        mid={listMid}
        head={head}
        days={days}
        born={profile?.born}
        focus={nav.listFocus}
        onOpen={(first) => nav.listIn(first)}
        onIn={() => nav.listIn(listMid.current())}
        onOut={listRes === 'months' ? () => nav.listOut(listMid.current()) : undefined}
        onPainting={openPainting}
      />
    )
  }
  if (screen === 'pie' && profile)
    return <Pie days={days} profile={profile} scope={nav.pieScope} onScope={nav.setPieScope} onSee={nav.seeSlice} />
  if (screen === 'year')
    return (
      <Year
        days={days}
        born={profile?.born}
        focus={nav.yearFocus}
        onPick={(m) => nav.goMonth(m)}
        onIn={() => nav.goMonth()}
        onOut={nav.goLife}
        onPainting={openPainting}
      />
    )
  if (screen === 'life' && profile)
    return lifeRes === 'days' ? (
      <LifeDays
        days={days}
        profile={profile}
        onPick={(iso) => nav.openDay(iso)}
        onIn={() => setLifeRes('months')}
        onResolution={setLifeRes}
        cols={[28, 14, 7, 3][mag]}
        focal={focal}
        onPainting={openPainting}
      />
    ) : lifeRes === 'months' ? (
      <LifeMonths
        days={days}
        profile={profile}
        onPick={(m) => nav.goMonth(m)}
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
        onPick={(y) => nav.goYear(y)}
        onIn={() => nav.goYear()}
        onOut={() => setLifeRes('months')}
        onResolution={setLifeRes}
      />
    )
  return (
    <Month
      days={days}
      born={profile?.born}
      focus={nav.monthFocus}
      onPick={(iso) => nav.openDay(iso)}
      onIn={nav.goToday}
      onOut={() => nav.goYear()}
      zoomed={mag > 0}
      anchor={nav.monthAnchor}
      onPainting={openPainting}
    />
  )
}
