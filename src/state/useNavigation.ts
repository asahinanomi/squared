import { useCallback, useRef, useState } from 'react'
import type { Resolution } from '../components/LifeHead'
import type { Only } from '../screens/DaysList'
import { todayIso } from '../lib/dates'
import type { Why } from '../lib/notes'
import { SCOPE_ORDER, type Scope, type SliceId } from '../lib/pie'
import type { Profile } from '../lib/profile'
import { usePinch } from '../lib/usePinch'
import { ideaAtStart, LADDER, leaveLegalUrl, legalAtStart, touchAtStart, type Legal, type Screen } from './app'

const RES: Resolution[] = ['years', 'months', 'days'] // the three views of a life, outward

/** Where you are and how you move: the screen and day, the zoom ladder (a day → its month → a life), the
 *  list and the pie beside it, the small print, settings, and pinching. */
export function useNavigation(profile: Profile | null, setWhy: (w: Why | null) => void, signedIn: boolean) {
  const [screen, setScreenValue] = useState<Screen>(legalAtStart ?? (ideaAtStart || touchAtStart ? 'idea' : 'today'))
  const [date, setDate] = useState(todayIso)
  // Which way the last move went, so the new level can zoom in or out into place.
  const [motion, setMotion] = useState<'in' | 'out' | null>(null)
  // The month to open on when zooming in from a life, or tapping a year on it (otherwise this month).
  const [monthFocus, setMonthFocus] = useState<string | undefined>()
  // Which view of a life: one square per year (where a life always lands), month or day.
  const [lifeRes, setLifeResValue] = useState<Resolution>('years')
  // Where "how many squares?" returns to: a life, when it was asked for on the way there.
  const [afterSetup, setAfterSetup] = useState<Screen>('today')
  // The zoom level the pie was opened from: the switch returns there.
  const [pieFrom, setPieFrom] = useState<Screen>('life')
  // Which days the pie is out of; it always opens on the whole life.
  const [pieScope, setPieScope] = useState<Scope>('life')
  // The list of days sits beside the ladder too: where it was opened from, and the day it opens on.
  const [listFrom, setListFrom] = useState<Screen>('month')
  const [listFocus, setListFocus] = useState(todayIso)
  // The list's level (its tabs: years · months · days; tapping a card opens the finer one), and where it opened.
  const [listRes, setListRes] = useState<Resolution>('days')
  const [listZoomed, setListZoomed] = useState(false) // zoomed within the list since it opened
  // Only one slice's days (from the pie's "see them →"), until cleared or the list zooms out.
  const [listOnly, setListOnly] = useState<Only[]>([]) // none ticked: every day
  // The list keeps this pointed at the day in the middle of the screen, for a pinch to open on.
  const listMid = useRef(() => todayIso())
  // A day opened from the list goes back to the list when you zoom out of it.
  const [dayFromList, setDayFromList] = useState(false)
  // Where privacy and terms were opened from (settings or about): back returns there.
  const [legalFrom, setLegalFrom] = useState<Screen>('settings')
  const legalOpened = useRef(false) // opened from inside the app (not straight from its web address)

  // A life (or the list) opened from my days shows "‹ my days" until you move on (another view, or zooming).
  const setScreen = (next: Screen) => {
    const a = LADDER.indexOf(screen)
    const b = LADDER.indexOf(next)
    setMotion(a < 0 || b < 0 || a === b ? null : b > a ? 'out' : 'in')
    if (next !== 'today') setDayFromList(false)
    setScreenValue(next)
  }
  // The three views of a life sit on the ladder too: years → months → days is zooming out.
  const setLifeRes = (r: Resolution) => {
    // The tabs keep your place: the new view opens on what was in the middle of this one (not on today).
    setLifeFocus(listMid.current())
    setMotion(RES.indexOf(r) > RES.indexOf(lifeRes) ? 'out' : RES.indexOf(r) < RES.indexOf(lifeRes) ? 'in' : null)
    setLifeResValue(r)
  }

  const goToday = () => {
    setDayFromList(false)
    setDate(todayIso())
    setScreen('today')
  }
  // The logo: today, now (home, its own page, was cut: today is now, my days looks back).
  const goHome = () => {
    setWhy(null)
    goToday()
  }
  /** A day, from anywhere that shows days. */
  const openDay = (iso: string, fromList = false) => {
    if (iso > todayIso()) return // a day ahead can't be opened, let alone painted
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
  /** "how many squares?", then on to `then`. */
  const askSquares = (then: Screen) => {
    setAfterSetup(then)
    setScreenValue('setup')
  }
  // Zooming out of a month lands on a life in days (every day of it, one square each), centred on the month you
  // were looking at. A life needs a birth date and a lifespan: the first time, ask (gently) on the way.
  const [lifeFocus, setLifeFocus] = useState<string | undefined>()
  const goLife = (focus?: string) => {
    setLifeResValue('days')
    setLifeFocus(focus)
    if (profile) return setScreen('life')
    askSquares('life')
  }
  // A life, in days (from my days' life card): on today.
  const goLifeDays = () => goLife()
  // The list of days, the same way: open it on the day you were looking at, and its switch takes you back.
  // It opens at the level that matches the squares (a life → its tab: years, months or days; a month → days); its
  // switch goes back where you came from, or — if you zoomed within the list — to the squares at that level.
  const toggleList = (at?: string) => {
    const day = at ?? todayIso()
    if (screen === 'list') {
      // Back to the squares where the list is (scrolled back to 2006, the squares open on 2006, not today).
      if (!listZoomed) {
        if (listFrom === 'month') return goMonth(day)
        if (listFrom === 'life') setLifeFocus(day)
        return setScreen(listFrom)
      }
      // Back to the squares at the same level and place: a life (from a life) at the list's tab, else the month.
      if (!profile || (listRes === 'days' && listFrom !== 'life')) return goMonth(day)
      setLifeResValue(listRes)
      setLifeFocus(day)
      return setScreen('life')
    }
    const from = screen === 'pie' ? pieFrom : screen
    const res: Resolution = from === 'life' ? lifeRes : 'days'
    setListFrom(from)
    setListOnly([])
    setListRes(res)
    setListZoomed(false)
    setListFocus(day)
    setScreen('list')
  }
  // Tapping a year or month card in the list: the finer level, opened there.
  const listIn = (at: string) => {
    setListZoomed(true)
    setListFocus(at)
    setListRes(listRes === 'years' ? 'months' : 'days')
  }
  // The capsule under the life's title jumps straight to a level of the list, where you are.
  const listTo = (r: Resolution) => {
    setListOnly([])
    setListZoomed(true)
    setListFocus(listMid.current())
    setListRes(r)
  }
  /** The pie's "see them →": that slice's days, in the list; its squares icon goes back to where the pie came from. */
  const seeSlice = (id: Exclude<SliceId, 'ahead'> | 'lived') => {
    setListFrom(pieFrom)
    setListRes('days')
    setListZoomed(false)
    setListFocus(todayIso())
    setListOnly(id === 'lived' ? [] : [id])
    setScreen('list')
  }
  const openSettings = () => setScreenValue('settings')
  // my days (the menu): a life as a pie, all your squares, what matters, your framed days and paintings.
  const openMyDays = () => setScreenValue('mydays')
  // The list from a page that isn't a view (my days, settings, about…): on today, and its switch's squares go to the
  // month.
  const openList = () => {
    setListFrom('month')
    setListOnly([])
    setListRes('days')
    setListZoomed(false)
    setListFocus(todayIso())
    setScreen('list')
  }
  // The pie lives in my days now: its back arrow returns there; its squares and list switch go to a life.
  const openPie = () => {
    setPieFrom('life')
    setPieScope('life')
    if (profile) return setScreen('pie')
    askSquares('pie')
  }
  const openMatters = () => setScreenValue('matters')
  // Back from how many squares: wherever it was asked from.
  const leaveSetup = () =>
    afterSetup === 'life'
      ? setScreen('month')
      : afterSetup === 'pie'
        ? setScreen(pieFrom)
        : afterSetup === 'settings' || afterSetup === 'mydays'
          ? setScreenValue(afterSetup)
          : afterSetup === 'month' || afterSetup === 'list'
            ? setScreen(afterSetup)
            : goToday()
  // Saved how many squares the first time: on to what asked for it (a life, the pie, back to my days).
  const afterSquares = () => {
    if (afterSetup === 'pie') setScreen('pie')
    else if (afterSetup === 'life') setScreen('life')
    else if (afterSetup === 'mydays') setScreenValue('mydays')
    else if (afterSetup === 'month' || afterSetup === 'list') setScreen(afterSetup)
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
        ? 'about'
        : 'back'

  // Pinch does what the zoom buttons do, one level at a time: day ↔ month ↔ a life (in days). A life in
  // months or days comes only from its tabs (pinching in there goes to this month); the list has no zoom (its tabs).
  const pinchIn = () => {
    if (screen === 'month') goToday()
    else if (screen === 'pie') {
      // On the pie, closer means fewer days counted: whole life → days I lived → painted only.
      const i = SCOPE_ORDER.indexOf(pieScope)
      if (i >= SCOPE_ORDER.length - 1) return false
      setPieScope(SCOPE_ORDER[i + 1])
    } else if (screen === 'life') goMonth(listMid.current())
    else return false
  }
  const pinchOut = () => {
    if (screen === 'today') outOfDay()
    else if (screen === 'month') goLife(listMid.current())
    else if (screen === 'pie') {
      const i = SCOPE_ORDER.indexOf(pieScope)
      if (i <= 0) return false
      setPieScope(SCOPE_ORDER[i - 1])
    } else return false
  }
  // The current level's stage is what scales under your fingers while you pinch.
  const stage = useCallback(() => document.querySelector<HTMLElement>('.stage'), [])
  const pinchRef = useRef({ onIn: pinchIn, onOut: pinchOut })
  pinchRef.current = { onIn: pinchIn, onOut: pinchOut }
  const live = useRef(signedIn)
  live.current = signedIn
  usePinch(stage, {
    onIn: () => (live.current ? pinchRef.current.onIn() : false), // signed out, a pinch does nothing
    onOut: () => (live.current ? pinchRef.current.onOut() : false),
  })

  return {
    screen,
    setScreen,
    setScreenValue,
    date,
    setDate,
    motion,
    monthFocus,
    lifeRes,
    setLifeRes,
    pieScope,
    setPieScope,
    listRes,
    listFocus,
    listOnly,
    setListOnly,
    listMid,
    afterSetup,
    legalBack,
    goToday,
    goHome,
    goMonth,
    goLife,
    goLifeDays,
    openList,
    lifeFocus,
    openDay,
    outOfDay,
    askSquares,
    toggleList,
    listIn,
    listTo,
    seeSlice,
    openSettings,
    openMatters,
    openMyDays,
    openPie,
    leaveSetup,
    afterSquares,
    openLegal,
    closeLegal,
  }
}
export type Navigation = ReturnType<typeof useNavigation>
