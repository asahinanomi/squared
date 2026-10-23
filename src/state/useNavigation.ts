import { useCallback, useRef, useState } from 'react'
import type { Resolution } from '../components/LifeHead'
import type { Only } from '../screens/DaysList'
import { todayIso } from '../lib/dates'
import type { Why } from '../lib/notes'
import { SCOPE_ORDER, type Scope, type SliceId } from '../lib/pie'
import type { Profile } from '../lib/profile'
import { usePinch, type Focal } from '../lib/usePinch'
import { LADDER, leaveLegalUrl, legalAtStart, trySquaresAtStart, tryWelcome, type Legal, type Screen } from './app'

const RES: Resolution[] = ['years', 'months', 'days'] // the three views of a life, outward
const MONTH_NOTCHES = 2
const LIFE_NOTCHES = 4

/** Where you are and how you move: the screen and day, the zoom ladder (a day → its month → its year → a life), the
 *  list and the pie beside it, the small print, settings, and pinching. */
export function useNavigation(profile: Profile | null, setWhy: (w: Why | null) => void, signedIn: boolean) {
  const [screen, setScreenValue] = useState<Screen>(
    legalAtStart ?? (tryWelcome ? 'welcome' : trySquaresAtStart ? 'setup' : 'today'),
  )
  const [date, setDate] = useState(todayIso)
  // Which way the last move went, so the new level can zoom in or out into place.
  const [motion, setMotion] = useState<'in' | 'out' | null>(null)
  // The month to open on when zooming in from a year (zooming out always lands on today's).
  const [monthFocus, setMonthFocus] = useState<string | undefined>()
  const [yearFocus, setYearFocus] = useState<number | undefined>()
  // Which view of a life: one square per year (where a life always lands), month or day.
  const [lifeRes, setLifeResValue] = useState<Resolution>('years')
  // Pinched in within a level (bigger squares, with labels): a notch, 0 = the level's own size.
  // Never remembered: every move to another level starts back at 0.
  const [mag, setMag] = useState(0)
  const [focal, setFocal] = useState<Focal | undefined>()
  const [monthAnchor, setMonthAnchor] = useState<{ iso?: string; y: number } | undefined>()
  // Where "how many squares?" returns to: a life, when it was asked for on the way there.
  const [afterSetup, setAfterSetup] = useState<Screen>(trySquaresAtStart ? 'life' : 'today')
  const [trySquares, setTrySquares] = useState(trySquaresAtStart)
  // The zoom level the pie was opened from: the switch returns there.
  const [pieFrom, setPieFrom] = useState<Screen>('life')
  // Which days the pie is out of; it always opens on the whole life.
  const [pieScope, setPieScope] = useState<Scope>('life')
  // The list of days sits beside the ladder too: where it was opened from, and the day it opens on.
  const [listFrom, setListFrom] = useState<Screen>('month')
  const [listFocus, setListFocus] = useState(todayIso)
  // The list zooms too, within itself: years → months → days (→ the day). And the level it was opened at.
  const [listRes, setListRes] = useState<Resolution>('days')
  const [listZoomed, setListZoomed] = useState(false) // zoomed within the list since it opened
  // Only one slice's days (from the pie's "see them →"), until cleared or the list zooms out.
  const [listOnly, setListOnly] = useState<Only | null>(null)
  // The list keeps this pointed at the day in the middle of the screen, for a pinch to open on.
  const listMid = useRef(() => todayIso())
  // A day opened from the list goes back to the list when you zoom out of it.
  const [dayFromList, setDayFromList] = useState(false)
  // What matters opens from settings, the idea, the day's compass or home; back returns there.
  const [mattersFrom, setMattersFrom] = useState<'settings' | 'idea' | 'today' | 'home' | 'mydays'>('settings')
  // Where privacy and terms were opened from (settings or the idea): back returns there.
  const [legalFrom, setLegalFrom] = useState<Screen>('settings')
  const legalOpened = useRef(false) // opened from inside the app (not straight from its web address)

  // A life (or the list) opened from my days shows "‹ my days" until you move on (another view, or zooming).
  const [lifeBack, setLifeBack] = useState(false)
  const setScreen = (next: Screen) => {
    const a = LADDER.indexOf(screen)
    const b = LADDER.indexOf(next)
    setMotion(a < 0 || b < 0 || a === b ? null : b > a ? 'out' : 'in')
    setMag(0)
    if (next !== 'today') setDayFromList(false)
    if (next !== 'life' && next !== 'list') setLifeBack(false)
    setScreenValue(next)
  }
  // The three views of a life sit on the ladder too: years → months → days is zooming out.
  const setLifeRes = (r: Resolution) => {
    setLifeBack(false)
    setMotion(RES.indexOf(r) > RES.indexOf(lifeRes) ? 'out' : RES.indexOf(r) < RES.indexOf(lifeRes) ? 'in' : null)
    setMag(0)
    setLifeResValue(r)
  }

  const goToday = () => {
    setDayFromList(false)
    setDate(todayIso())
    setScreen('today')
  }
  const goHome = () => {
    setWhy(null)
    setDayFromList(false)
    setDate(todayIso())
    setScreen('home')
  }
  /** A day, from anywhere that shows days. */
  const openDay = (iso: string, fromList = false) => {
    setDate(iso)
    if (fromList) setDayFromList(true)
    setScreen('today')
  }
  // Zoom out from the square: the month, always the current one.
  const goMonth = (focus?: string) => {
    setWhy(null)
    setMonthFocus(focus)
    setScreen('month')
  }
  // Zoom out of a day: to its month — or back to the list, if it was opened from there.
  const outOfDay = () => {
    if (!dayFromList) return goMonth()
    setWhy(null)
    setDayFromList(false)
    setScreen('list')
  }
  const goYear = (focus?: number) => {
    setYearFocus(focus)
    setScreen('year')
  }
  /** "how many squares?", then on to `then`. */
  const askSquares = (then: Screen) => {
    setAfterSetup(then)
    setScreenValue('setup')
  }
  // A life needs a birth date and a lifespan: the first time, ask (gently) on the way.
  const goLife = () => {
    setLifeResValue('years')
    if (profile) return setScreen('life')
    askSquares('life')
  }
  // A life, in days (from home's life card).
  const goLifeDays = () => {
    setLifeResValue('days')
    if (profile) return setScreen('life')
    askSquares('life')
  }
  // The list of days, the same way: open it on the day you were looking at, and its switch takes you back.
  // It opens at the level that matches the squares (a life → years, a year → months, a month → days); its
  // switch goes back where you came from, or — if you zoomed within the list — to the squares at that level.
  const toggleList = (at?: string) => {
    setLifeBack(false)
    const day = at ?? todayIso()
    if (screen === 'list') {
      if (!listZoomed) return setScreen(listFrom)
      if (listRes === 'days') return goMonth(day)
      if (listRes === 'months') return goYear(Number(day.slice(0, 4)))
      return goLife()
    }
    const from = screen === 'pie' ? pieFrom : screen
    const res: Resolution = from === 'life' ? lifeRes : from === 'year' ? 'months' : 'days'
    setListFrom(from)
    setListOnly(null)
    setListRes(res)
    setListZoomed(false)
    setListFocus(day)
    setScreen('list')
  }
  const listIn = (at: string) => {
    setLifeBack(false)
    // From the days: today's square, and zooming out of it comes back here.
    if (listRes === 'days') {
      setDate(todayIso())
      setScreen('today')
      return setDayFromList(true)
    }
    setListZoomed(true)
    setListFocus(at)
    setListRes(listRes === 'years' ? 'months' : 'days')
  }
  // The capsule under the life's title jumps straight to a level of the list, where you are.
  const listTo = (r: Resolution) => {
    setLifeBack(false)
    setListOnly(null)
    setListZoomed(true)
    setListFocus(listMid.current())
    setListRes(r)
  }
  const listOut = (at: string) => {
    if (listRes === 'years') return false
    setLifeBack(false)
    setListOnly(null)
    setListZoomed(true)
    setListFocus(at)
    setListRes(listRes === 'days' ? 'months' : 'years')
  }
  /** The pie's "see them →": that slice's days, in the list; its squares icon goes back to where the pie came from. */
  const seeSlice = (id: Exclude<SliceId, 'ahead'> | 'lived') => {
    setListFrom(pieFrom)
    setListRes('days')
    setListZoomed(false)
    setListFocus(todayIso())
    setListOnly(id === 'lived' ? null : id)
    setScreen('list')
  }
  const openSettings = () => setScreenValue('settings')
  // my days (the menu): a life as a pie, all your squares, what matters, your framed days and paintings.
  const openMyDays = () => setScreenValue('mydays')
  // my days' bar: the list of days, on today (its squares switch goes to the month, the same level).
  const openListFromMyDays = () => {
    setListFrom('month')
    setListOnly(null)
    setListRes('days')
    setListZoomed(false)
    setListFocus(todayIso())
    setScreen('list')
    setLifeBack(true)
  }
  const openLifeFromMyDays = () => {
    goLifeDays()
    if (profile) setLifeBack(true)
  }
  // The pie lives in my days now: its back arrow returns there; its squares and list switch go to a life.
  const openPie = () => {
    setPieFrom('life')
    setPieScope('life')
    if (profile) return setScreen('pie')
    askSquares('pie')
  }
  // my framed days opens from home or my days; back returns there.
  const [framedFrom, setFramedFrom] = useState<'home' | 'mydays' | 'list'>('mydays')
  const openFramed = (from: 'home' | 'mydays' | 'list') => {
    setFramedFrom(from)
    setScreenValue('framed')
  }
  const openMatters = (from: 'settings' | 'idea' | 'today' | 'home' | 'mydays') => {
    setMattersFrom(from)
    setScreenValue('matters')
  }
  const endTrySquares = () => {
    setTrySquares(false)
    history.replaceState(null, '', location.pathname)
    goToday()
  }
  // Back from how many squares: wherever it was asked from.
  const leaveSetup = () =>
    afterSetup === 'home'
      ? goHome()
      : afterSetup === 'life'
        ? setScreen('year')
        : afterSetup === 'pie'
          ? setScreen(pieFrom)
          : afterSetup === 'settings'
            ? setScreenValue('settings')
            : goToday()
  // Saved how many squares: the first run ends on "start painting", straight to today's square.
  const afterSquares = () => {
    if (afterSetup === 'pie') setScreen('pie')
    else if (afterSetup === 'home') goHome()
    else if (afterSetup !== 'settings') goToday()
  }
  const openLegal = (page: Legal, from: Screen) => {
    legalOpened.current = true
    setLegalFrom(from)
    setScreenValue(page)
  }
  // Back from privacy or terms: where it was opened from, or today when it came straight from its web address.
  const closeLegal = () => {
    if (legalOpened.current) return setScreenValue(legalFrom)
    leaveLegalUrl()
    legalOpened.current = true
    goToday()
  }
  // Back from the small print: "settings" when opened there, "back" from the menu, "today" from its web address
  // ("back" before the squares are set: it leads to onboarding).
  const legalBack = !legalOpened.current
    ? profile
      ? 'today'
      : 'back'
    : legalFrom === 'settings'
      ? 'settings'
      : legalFrom === 'idea'
        ? 'the idea'
        : 'back'

  // Pinch: out walks the ladder outward (today → month → year → a life in years → months → days);
  // in enlarges the squares where there's more to read (month, a life in months or days), else steps in.
  const pinchIn = (at: Focal) => {
    if (screen === 'list') return listIn(listMid.current())
    else if (screen === 'month') {
      if (mag >= MONTH_NOTCHES - 1) return false
      const hit = document.elementsFromPoint(at.x, at.y).find((el) => (el as HTMLElement).dataset?.iso) as HTMLElement
      setMonthAnchor({ iso: hit?.dataset.iso, y: at.y })
      setMag(mag + 1)
    } else if (screen === 'year') goMonth()
    else if (screen === 'pie') {
      // On the pie, closer means fewer days counted: whole life → days I lived → painted only.
      const i = SCOPE_ORDER.indexOf(pieScope)
      if (i >= SCOPE_ORDER.length - 1) return false
      setPieScope(SCOPE_ORDER[i + 1])
    } else if (screen === 'life' && lifeRes === 'years') goYear()
    else if (screen === 'life') {
      if (mag >= LIFE_NOTCHES - 1) return false
      setFocal(at)
      setMag(mag + 1)
    } else return false
  }
  const pinchOut = (at: Focal) => {
    if (screen === 'today') outOfDay()
    else if (screen === 'list') return listOut(listMid.current())
    else if (screen === 'month') {
      if (mag === 0) return goYear()
      const hit = document.elementsFromPoint(at.x, at.y).find((el) => (el as HTMLElement).dataset?.iso) as HTMLElement
      setMonthAnchor({ iso: hit?.dataset.iso, y: at.y })
      setMag(mag - 1)
    } else if (screen === 'year') goLife()
    else if (screen === 'pie') {
      const i = SCOPE_ORDER.indexOf(pieScope)
      if (i <= 0) return false
      setPieScope(SCOPE_ORDER[i - 1])
    } else if (screen === 'life') {
      if (mag > 0) {
        setFocal(at)
        setMag(mag - 1)
      } else if (lifeRes === 'years') setLifeRes('months')
      else if (lifeRes === 'months') setLifeRes('days')
      else return false
    } else return false
  }
  // The current level's stage is what scales under your fingers while you pinch.
  const stage = useCallback(() => document.querySelector<HTMLElement>('.stage'), [])
  const pinchRef = useRef({ onIn: pinchIn, onOut: pinchOut })
  pinchRef.current = { onIn: pinchIn, onOut: pinchOut }
  const live = useRef(signedIn)
  live.current = signedIn
  usePinch(stage, {
    onIn: (at) => (live.current ? pinchRef.current.onIn(at) : false), // signed out, a pinch does nothing
    onOut: (at) => (live.current ? pinchRef.current.onOut(at) : false),
  })

  return {
    screen,
    setScreen,
    setScreenValue,
    date,
    setDate,
    motion,
    mag,
    focal,
    monthFocus,
    monthAnchor,
    yearFocus,
    lifeRes,
    setLifeRes,
    pieScope,
    setPieScope,
    listRes,
    listFocus,
    listOnly,
    setListOnly,
    listMid,
    trySquares,
    afterSetup,
    mattersFrom,
    legalBack,
    goToday,
    goHome,
    goMonth,
    goYear,
    goLife,
    goLifeDays,
    openDay,
    outOfDay,
    askSquares,
    toggleList,
    listIn,
    listTo,
    listOut,
    seeSlice,
    openSettings,
    openMatters,
    framedFrom,
    openFramed,
    openMyDays,
    openLifeFromMyDays,
    openListFromMyDays,
    lifeBack,
    openPie,
    endTrySquares,
    leaveSetup,
    afterSquares,
    openLegal,
    closeLegal,
  }
}
export type Navigation = ReturnType<typeof useNavigation>
