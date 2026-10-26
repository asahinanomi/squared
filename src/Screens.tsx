import { LifeHead } from './components/LifeHead'
import { todayIso } from './lib/dates'
import { fetchMatters } from './lib/matters'
import { fetchAllNotes, legacyNotes, type Why } from './lib/notes'
import type { Paint } from './lib/paints'
import { saveProfile } from './lib/profile'
import { About } from './screens/About'
import { DaysList } from './screens/DaysList'
import { Export } from './screens/Export'
import { Framed } from './screens/Framed'
import { Life } from './screens/Life'
import { LifeDays } from './screens/LifeDays'
import { LifeMonths } from './screens/LifeMonths'
import { Month } from './screens/Month'
import { MyDays } from './screens/MyDays'
import { Paintings } from './screens/Paintings'
import { PeriodList } from './screens/PeriodList'
import { Pie } from './screens/Pie'
import { Privacy } from './screens/Privacy'
import { Questions } from './screens/Questions'
import { Settings } from './screens/Settings'
import { Setup } from './screens/Setup'
import { Terms } from './screens/Terms'
import { Today } from './screens/Today'
import { WhatMatters } from './screens/WhatMatters'
import { demo, endWelcomeTest, introSeen, markIntroSeen, tryWelcome } from './state/app'
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
  /** The account was deleted: say so, then sign out. */
  onDeleted: () => void
  ui: {
    why: Why | null
    setWhy: (w: Why | null) => void
    loaded: Paint | null
    setLoaded: (p: Paint | null) => void
    nudge: boolean
    onDryBrush: () => void
    onDefine: () => void
    onFind: () => void
  }
}

// Which screen shows, and what each one is given. Every screen gets what it needs from the app's pieces (the
// navigation, the account's data, the day's actions, what matters, paintings); nothing here keeps state.
export function Screens({ nav, acc, act, lists, wall, openPainting, painter, onDeleted, ui }: ScreensProps) {
  const { screen, setScreenValue, date, mag, focal, lifeRes, setLifeRes, listRes, listMid } = nav
  const { days, notes, profile } = acc

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
        onSetUp={() => nav.askSquares('today')}
        // Someone new (nothing painted, squares not set): the colours, once. ?welcome shows it on any account.
        intro={tryWelcome || (!profile && Object.keys(days).length === 0 && !introSeen())}
        onIntroDone={() => {
          markIntroSeen()
          endWelcomeTest()
        }}
      />
    )
  if (screen === 'paintings')
    return (
      <Paintings
        kept={wall.kept}
        days={days}
        name={painter}
        onBack={nav.openMyDays}
        onRemove={wall.remove}
        onOpen={openPainting}
      />
    )
  if (screen === 'mydays')
    return (
      <MyDays
        days={days}
        profile={profile}
        matters={lists.matters.meaningful.map((e) => e.text.trim()).filter(Boolean)}
        onDay={(iso) => nav.openDay(iso)}
        kept={wall.kept}
        onSetUp={() => nav.askSquares('mydays')}
        onPainting={openPainting}
        onList={nav.openListFromMyDays}
        onPie={nav.openPie}
        onSquares={nav.openLifeFromMyDays}
        onMatters={() => nav.openMatters('mydays')}
        onFramed={() => nav.openFramed('mydays')}
        onPaintings={() => setScreenValue('paintings')}
        onToday={nav.goToday}
      />
    )
  if (screen === 'framed')
    return (
      <Framed
        days={days}
        notes={notes}
        loadNotes={acc.loadNotes}
        onDay={(iso) => nav.openDay(iso)}
        onBack={() => setScreenValue(nav.framedFrom)}
        backLabel={nav.framedFrom === 'mydays' ? 'my days' : nav.framedFrom}
      />
    )
  if (screen === 'idea')
    return <About onMatters={() => nav.openMatters('idea')} onLegal={(page) => nav.openLegal(page, 'idea')} />
  if (screen === 'setup')
    return (
      <Setup
        profile={profile}
        onBack={nav.leaveSetup}
        mode={nav.afterSetup === 'settings' ? 'settings' : 'onboarding'}
        why={
          nav.afterSetup === 'life' || nav.afterSetup === 'pie'
            ? 'To see your whole life at once, squared needs two answers.'
            : nav.afterSetup === 'month' || nav.afterSetup === 'list' || nav.afterSetup === 'today'
              ? 'To go further back, squared needs two answers.'
              : undefined
        }
        onSave={async (p) => {
          await saveProfile(p)
          acc.setProfile(p)
          nav.afterSquares()
        }}
      />
    )
  if (screen === 'settings')
    return (
      <Settings
        profile={profile}
        onSquares={() => nav.askSquares('settings')}
        onDeleted={onDeleted}
        onPrivacy={() => nav.openLegal('privacy', 'settings')}
        onTerms={() => nav.openLegal('terms', 'settings')}
        onExport={() => setScreenValue('export')}
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
        backLabel={nav.mattersFrom === 'idea' ? 'about' : nav.mattersFrom === 'mydays' ? 'my days' : nav.mattersFrom}
        onPaint={nav.goToday}
        paintedToday={!!days[todayIso()]}
        initial={lists.matters}
        onSaved={lists.setMatters}
      />
    )
  if (screen === 'list') {
    // Without a birth date, the capsule's place holds the way to set one (the list stops at your first square's year).
    const head = profile ? (
      <LifeHead
        profile={profile}
        current={listRes}
        onPick={nav.listTo}
        onBack={nav.lifeBack ? nav.openMyDays : undefined}
      />
    ) : (
      <div className="life-head">
        <h1 className="life-title">a life</h1>
        <button className="ladder-setup is-in-head" onClick={() => nav.askSquares('list')}>
          set your birth date to go further back ›
        </button>
      </div>
    )
    return listRes === 'days' ? (
      <DaysList
        key={`days-${nav.listOnly}`}
        only={nav.listOnly ?? undefined}
        onOnly={nav.setListOnly}
        onFramedDays={() => nav.openFramed('list')}
        onAllNotes={acc.loadAllNotes}
        mid={listMid}
        head={head}
        days={days}
        notes={notes}
        born={profile?.born}
        focus={nav.listFocus}
        onPick={(iso) => nav.openDay(iso, true)}
        onMonthShown={acc.loadNotes}
        onPainting={openPainting}
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
        onPainting={openPainting}
      />
    )
  }
  if (screen === 'pie' && profile)
    return (
      <Pie
        days={days}
        profile={profile}
        scope={nav.pieScope}
        onScope={nav.setPieScope}
        onSee={nav.seeSlice}
        onBack={nav.openMyDays}
      />
    )
  if (screen === 'life' && profile)
    return lifeRes === 'days' ? (
      <LifeDays
        days={days}
        profile={profile}
        onPick={(iso) => nav.openDay(iso)}
        onIn={(at) => nav.goMonth(at)}
        focus={nav.lifeFocus}
        mid={listMid}
        onResolution={setLifeRes}
        cols={[28, 14, 7, 3][mag]}
        focal={focal}
        onPainting={openPainting}
        onBack={nav.lifeBack ? nav.openMyDays : undefined}
      />
    ) : lifeRes === 'months' ? (
      <LifeMonths
        days={days}
        profile={profile}
        onPick={(m) => nav.goMonth(m)}
        onIn={() => nav.goMonth()}
        onResolution={setLifeRes}
        cols={[12, 6, 4, 3][mag]}
        focal={focal}
      />
    ) : (
      <Life
        days={days}
        profile={profile}
        onPick={(y) => nav.goMonth(`${y}-${todayIso().slice(5, 7)}-01`)}
        onIn={() => nav.goMonth()}
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
      onOut={(at) => nav.goLife(at)}
      mid={listMid}
      zoomed={mag > 0}
      anchor={nav.monthAnchor}
      onPainting={openPainting}
      onSetUp={() => nav.askSquares('month')}
    />
  )
}
