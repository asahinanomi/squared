import { useContext, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { showFirstPaint } from '../lib/firstPaint'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { MomentBox } from '../components/MomentBox'
import { Turn } from '../components/Turn'
import { onceToday } from '../lib/onceADay'
import { NotesList } from '../components/NotesList'
import { Sheet } from '../components/Sheet'
import { PaintCanvas } from '../components/PaintCanvas'
import { Palette } from '../components/Palette'
import { Question } from '../components/Question'
import { WhyBubble } from '../components/WhyBubble'
import { ZoomBar } from '../components/ZoomBar'
import { addDays, firstDay, fromIso, longDate, ordinal, shortDateParts, todayIso } from '../lib/dates'
import { handsOn, type Days } from '../lib/days'
import type { Note, Why } from '../lib/notes'
import { PAINTS, paintHex, type Paint } from '../lib/paints'
import { dayWords, firstSquare } from '../lib/pastWords'
import type { Kind, Matters } from '../lib/matters'
import { specialDay } from '../lib/special'
import { DayFinder } from '../components/DayFinder'
import { Raised } from '../components/Raised'
import { OpenPainting } from '../components/PaintingButton'
import { firstPaintTest, tryBirthday } from '../state/app'
import { questionFor } from '../lib/question'

type Props = {
  question: string
  /** Birth date, if known: the earliest day you can step back to. */
  born?: string
  date: string
  days: Days
  /** What matters, from the account: a moment's words can be added to it. */
  matters: Matters
  notes: Note[]
  loaded: Paint | null
  /** The open "why?" bubble: a new note, or an existing note being edited. */
  why: Why | null
  nudge: boolean
  onDate: (iso: string) => void
  /** Wipe the day's square back to blank (after a confirm). */
  onWipe: () => void
  /** Frame (or unframe) a day you want to keep. */
  onFrame: () => void
  /** Mark the day "out of my hands" (then "Some days aren’t yours to choose.", a few words or skip); or unmark it. */
  onMarkHands: () => void
  onUnmarkHands: () => void
  /** Pin a note to the top of its day, or unpin it. */
  onPinNote: (note: Note) => void
  /** Paint a moment in its own colour, or take it away (null). */
  onPaintNote: (note: Note, color: Paint | null) => void
  /** Dip the brush in a colour. */
  onLoad: (p: Paint) => void
  onDefine: () => void
  /** Saves a new note, or updates `note` (instantly; a failure reopens the box). */
  onSaveNote: (note: Note | undefined, text: string, color?: Paint) => Promise<void>
  onDeleteNote: (note: Note) => Promise<void>
  onCloseWhy: () => void
  onOpenWhy: (note?: Note) => void
  onDryBrush: () => void
  onFilled: (p: Paint) => void
  /** Zoom out to the month. */
  onZoomOut: () => void
  /** Keep a moment's words as a line in what matters (worth it, or regret). */
  onKeepMatter: (kind: Kind, text: string) => void
  /** "how many squares?", from the day finder (without a birth date, its years start at your first square's). */
  onSetUp?: () => void
  /** Someone's first visit: the colours, once, in a sheet (each square is a day, what each colour means). Read when
   *  the day opens; "got it" closes it for good. */
  intro?: boolean
  onIntroDone?: () => void
}

// The blank square says how far back its day is (the date above says which day), so a slip to another day shows
// before the first stroke, on two lines ("paint" above): "paint your day", "paint yesterday", "paint 3 days ago", "paint last week",
// "paint 2 months ago", "paint 17 years ago".
// The first visit's sheet: the three colours, each a plain sentence.
const INTRO: [Paint, string][] = [
  ['green', 'green means I spent it on what matters.'],
  ['red', 'red means I wish I’d spent it differently.'],
  ['grey', 'grey means I wasn’t paying attention.'],
]

// A special day's word on its blank square, short enough for the square's two hand-written lines (nomi, Nov 4, 2026:
// "paint your 18th birthday" ran edge to edge): the heading and the date already say which birthday.
function blankSpecial(occasion: string) {
  if (/^your \S+ birthday$/.test(occasion)) return 'your birthday'
  if (occasion === 'the day you were born') return 'your first day'
  return occasion
}

function blankWord(date: string, today: string) {
  const days = Math.round((fromIso(today).getTime() - fromIso(date).getTime()) / 86_400_000)
  const ago = (n: number, unit: string) => `paint\n${n} ${unit}${n === 1 ? '' : 's'} ago`
  if (days <= 0) return 'paint\nyour day'
  if (days === 1) return 'paint\nyesterday'
  if (days < 7) return ago(days, 'day')
  if (days < 14) return 'paint\nlast week'
  if (days < 30) return ago(Math.floor(days / 7), 'week')
  if (days < 60) return 'paint\nlast month'
  if (days < 365) return ago(Math.floor(days / 30.44), 'month')
  if (days < 730) return 'paint\na year ago'
  return ago(Math.floor(days / 365.25), 'year')
}

// One breath, in and out (in step with the CSS: breathe, breathe-in). 2.4s: calm, without feeling like a wait.
const BREATH_MS = 2400

export function Today(props: Props) {
  const { question, born, date, days, notes, loaded, why, nudge, onDate, onLoad, onDefine, onDryBrush, onFilled } =
    props
  const { onSaveNote, onDeleteNote, onCloseWhy, onOpenWhy, onZoomOut } = props
  const today = todayIso()
  const [introOpen, setIntroOpen] = useState(!!props.intro)
  // The top bar's middle, where the date goes (found once the bar is on the page).
  const [barCenter, setBarCenter] = useState<HTMLElement | null>(null)
  useLayoutEffect(() => setBarCenter(document.getElementById('topbar-center')), [])
  const introDone = () => {
    setIntroOpen(false)
    props.onIntroDone?.()
  }
  // Your birthday: on today, once a year, a few words from nomi (never over the first visit's sheet, and after a
  // new month's painting is put away, when the two land on the same day).
  const paintingUp = useContext(OpenPainting)
  const birthday = tryBirthday || (!!born && today !== born && !!specialDay(today, born)?.includes('birthday'))
  const age = born ? Number(today.slice(0, 4)) - Number(born.slice(0, 4)) : 0
  const [birthdayOpen, setBirthdayOpen] = useState(false)
  useEffect(() => {
    if (!birthday || date !== today || introOpen || paintingUp) return
    try {
      if (!tryBirthday && localStorage.getItem('squared.birthdaySeen') === today) return
      localStorage.setItem('squared.birthdaySeen', today)
    } catch {
      /* no storage: it may show again today, that's fine */
    }
    setBirthdayOpen(true)
  }, [birthday, date, today, introOpen, paintingUp])

  const prev = addDays(date, -1)
  const next = addDays(date, 1)
  const day = days[date]
  // A moment's words can go into what matters: a worth-it one into "worth it", a regret one into "regret" (its own
  // colour, else the day's). Not a framed day's "what do you want to remember?", a marked day's, or one written as it
  // happens (the day isn't answered yet).
  const keepIn = (w: Why) => {
    const kind = (c?: Paint): Kind | undefined => (c === 'green' ? 'meaningful' : c === 'red' ? 'wasted' : undefined)
    const k = w.note ? kind(w.note.color ?? day?.color) : w.pinned || w.happened ? undefined : kind(day?.color)
    if (!k) return undefined
    return {
      has: (t: string) => props.matters[k].some((e) => e.text.trim() === t),
      add: (t: string) => props.onKeepMatter(k, t),
    }
  }
  const special = specialDay(date, born)
  // The day you started squared: found once per change to your squares, not on every render.
  const first = useMemo(() => firstSquare(days), [days])
  // A painted day speaks back: its own words, from where you stand (src/lib/pastWords.ts).
  const words = day
    ? dayWords({
        iso: date,
        today,
        paint: day.color,
        special,
        born,
        framed: day.framed,
        outOfHands: day.outOfHands,
        first,
        moments: notes.flatMap((n) => (n.color ? [n.color] : [])),
      })
    : null

  // On each dip, the dipped colour's meaning, one quiet line right under the palette (nomi, Nov 4, 2026: from the
  // bottom of the screen, it sat under the painting hand). It blocks nothing: it goes by itself after a few seconds,
  // or at the next touch, and a stroke on the square still paints.
  const [whisper, setWhisper] = useState<{ paint: Paint; at: number } | null>(null)
  const [whispering, setWhispering] = useState(false)
  const [wiping, setWiping] = useState(false)
  // "more" under the square: the rare ways to keep a day (frame it, out of my hands), each with a line about it.
  const [moreOpen, setMoreOpen] = useState(false)
  useEffect(() => {
    if (!whisper) return
    setWhispering(true)
    const t = setTimeout(() => setWhispering(false), 3000)
    return () => clearTimeout(t)
  }, [whisper])
  useEffect(() => {
    if (!whispering) return
    const away = () => setWhispering(false)
    document.addEventListener('pointerdown', away, true)
    return () => document.removeEventListener('pointerdown', away, true)
  }, [whispering])
  // Torn between green and red: on the third dip into them (both among them), the line under the palette becomes
  // "torn? paint what won ›" (once a dip's meaning has faded: meanings always win) until the brush touches the square; a
  // tap opens the short torn sheet. Never a sheet on its own (nomi, Nov 4, 2026: it rose for people only trying the colours, and covered the
  // square). Grey dips don't count.
  const dips = useRef<Paint[]>([])
  const [torn, setTorn] = useState(false)
  useEffect(() => {
    dips.current = []
    setTorn(false)
  }, [date])
  // One breath before you paint: each time you come to today while it's blank, its first dip makes the canvas breathe
  // once (4s, "be here"); more dips in the same visit choose quietly. Starting any day over is a fresh start too.
  // It never holds the brush.
  const [breathing, setBreathing] = useState(false)
  // A new day begins: once a day the date turns over (DayLabel), and the brush's hint on a blank square waits for it to
  // finish, so the two take turns instead of moving at once (nomi, Nov 2, 2026).
  const [dayTurns] = useState(() => date === todayIso() && onceToday('dayTurned'))
  const breathed = useRef(false)
  const fresh = useRef<string | null>(null)
  useEffect(() => {
    breathed.current = false
  }, [date])
  const breathe = () => {
    if (days[date]) return
    if (fresh.current !== date && (date !== today || breathed.current)) return
    fresh.current = null
    breathed.current = true
    setBreathing(true)
    setTimeout(() => setBreathing(false), BREATH_MS)
  }
  const dip = (p: Paint) => {
    breathe()
    onLoad(p)
    setWhisper({ paint: p, at: Date.now() })
    if (p === 'grey') return
    const d = (dips.current = [...dips.current, p])
    // Never for someone new (fewer than 7 days painted): tapping the colours to read them looks just like being torn.
    if (!torn && Object.keys(days).length >= 7 && d.length >= 3 && d.includes('green') && d.includes('red')) {
      setTorn(true)
    }
  }
  // Your own "mattered" entries, listed in the sheet.
  const [compassOpen, setCompassOpen] = useState(false)
  useEffect(() => setCompassOpen(false), [date])

  // How to paint, acted out by the brush (nomi, Nov 4, 2026; it replaced the ghost hint): on a blank today, every time,
  // until someone has painted their first square, then never again; only with nothing over the day (the
  // first-visit sheet, a painting that arrived, a birthday: nomi, Nov 4, 2026), and after the date has turned over if
  // it does. ?firstpaint plays it any time. Any touch ends it.
  // Something was over the day: as it goes (its slide out), the brush starts, with no pause (nomi, Nov 4, 2026).
  const covered = useRef(false)
  useEffect(() => {
    if (introOpen || paintingUp || birthdayOpen) covered.current = true
    if (day || date !== today || introOpen || paintingUp || birthdayOpen) return
    let stop = () => {}
    const t = setTimeout(
      () => {
        // Every time, until the first square is painted (nomi, Nov 4, 2026: once a day missed people still stuck).
        if (firstPaintTest || Object.keys(days).length === 0) stop = showFirstPaint()
      },
      covered.current ? 320 : dayTurns ? 2200 : 1200,
    )
    return () => {
      clearTimeout(t)
      stop()
    }
  }, [introOpen, paintingUp, birthdayOpen]) // eslint-disable-line react-hooks/exhaustive-deps

  // Just painted today: the question stays up while "because…" is open, and the day's line comes as you close it
  // (written or skipped): that's the "done" (nomi, Nov 5, 2026, beta 1: people didn't know they had finished).
  // Any day you paint, not only today (nomi, Nov 5, 2026). Stepping to another day never counts as painting it.
  const [answering, setAnswering] = useState(false)
  const wasPainted = useRef(!!day)
  const wasDate = useRef(date)
  useEffect(() => {
    if (wasDate.current === date && day && !wasPainted.current) setAnswering(true)
    wasPainted.current = !!day
    wasDate.current = date
  }, [day, date])
  useEffect(() => {
    if (!answering) return
    if (why) return
    // Closed, or (if the bubble somehow never came) a few seconds on: the day's line comes.
    const t = setTimeout(() => setAnswering(false), hadAnswer.current ? 0 : 4000)
    return () => clearTimeout(t)
  }, [why, answering])
  const hadAnswer = useRef(false)
  useEffect(() => {
    if (answering && why) hadAnswer.current = true
    if (!answering) hadAnswer.current = false
  }, [why, answering])
  useEffect(() => setAnswering(false), [date])
  // As the answer is done, the day's line writes itself in, left to right, as the square signs its word (nomi, Nov 5,
  // 2026: swapped in at once, it was easy to miss). Only at that moment, never when a painted day opens.
  const [signing, setSigning] = useState(false)
  const wasAnswering = useRef(false)
  useEffect(() => {
    if (wasAnswering.current && !answering) {
      setSigning(true)
      const t = setTimeout(() => setSigning(false), 2800)
      wasAnswering.current = answering
      return () => clearTimeout(t)
    }
    wasAnswering.current = answering
  }, [answering])
  useEffect(() => setSigning(false), [date]) // only the day just answered, never the next one you step to

  // A first painted day: where it went (nomi, Nov 5, 2026, beta 1: "once I finished, I didn't know what had happened").
  // On someone's first three painted days, as the "because…" bubble closes, zoom out hops once with an ink bubble
  // beside it, "see today in your month →"; it goes at the next touch, or after 15 seconds.
  const [monthHint, setMonthHint] = useState(false)
  const hadWhy = useRef(false)
  useEffect(() => {
    const closed = hadWhy.current && !why
    hadWhy.current = !!why
    if (!closed || !day || date !== today || Object.keys(days).length > 3) return
    setMonthHint(true)
    const t = setTimeout(() => setMonthHint(false), 15000)
    // Any touch elsewhere puts it away (a touch on it, or on zoom out, goes to the month).
    const away = (e: PointerEvent) => {
      if ((e.target as Element | null)?.closest?.('.zoom-stack')) return
      setMonthHint(false)
    }
    const arm = setTimeout(() => document.addEventListener('pointerdown', away), 400)
    return () => {
      clearTimeout(t)
      clearTimeout(arm)
      document.removeEventListener('pointerdown', away)
    }
  }, [why]) // eslint-disable-line react-hooks/exhaustive-deps

  // Day by day, sideways: yesterday waits on the left, tomorrow (until today) on the right.
  const hasPrev = prev >= firstDay(days, born)
  const hasNext = next <= today
  const [slide, setSlide] = useState<'from-left' | 'from-right' | null>(null)
  // Find a day from your past: which year, which month, which day (the date's capsule opens it).
  const [finding, setFinding] = useState(false)
  const step = (dir: -1 | 1) => {
    if (dir < 0 ? !hasPrev : !hasNext) return false
    setSlide(dir < 0 ? 'from-left' : 'from-right')
    onDate(dir < 0 ? prev : next)
    return true
  }

  // A finger swipe across the top part (never on the square, a note, or Safari's back edge): one day per swipe.
  const swipe = useRef<{ id: number; x: number; y: number; on: boolean } | null>(null)
  const [pull, setPull] = useState(0)
  const swipeDown = (e: React.PointerEvent) => {
    if (why || e.pointerType === 'mouse') return
    if (swipe.current) return (swipe.current = null) // a second finger: a pinch, not a swipe
    const t = e.target as Element
    if (t.closest('.paint-reach, .why, .moment-box, .swipe')) return // a moment swipes its own way (to delete)
    if (e.clientX < 24 || e.clientX > window.innerWidth - 24) return
    swipe.current = { id: e.pointerId, x: e.clientX, y: e.clientY, on: false }
  }
  const swipeMove = (e: React.PointerEvent) => {
    const s = swipe.current
    if (!s || s.id !== e.pointerId) return
    const dx = e.clientX - s.x
    const dy = e.clientY - s.y
    if (!s.on) {
      if (Math.abs(dy) > 10 && Math.abs(dy) > Math.abs(dx)) return (swipe.current = null) // scrolling the page
      if (Math.abs(dx) < 10) return
      s.on = true
      e.currentTarget.setPointerCapture(e.pointerId)
    }
    // Follows the finger; past the last day it only gives a little (a soft stop at today).
    const can = dx > 0 ? hasPrev : hasNext
    setPull(dx * (can ? 0.5 : 0.18))
  }
  const swipeUp = (e: React.PointerEvent) => {
    const s = swipe.current
    if (!s || s.id !== e.pointerId) return
    swipe.current = null
    const dx = e.clientX - s.x
    setPull(0)
    if (s.on && Math.abs(dx) > 56 && step(dx > 0 ? -1 : 1)) navigator.vibrate?.(8)
  }

  // Trackpad (a sideways two-finger swipe) and the arrow keys: also one day at a time.
  const stepRef = useRef(step)
  stepRef.current = step
  useEffect(() => {
    let acc = 0
    let quiet: ReturnType<typeof setTimeout> | undefined
    let locked = false
    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return
      e.preventDefault() // not the browser's back/forward swipe
      clearTimeout(quiet)
      quiet = setTimeout(() => {
        locked = false
        acc = 0
      }, 260)
      if (locked) return
      acc += e.deltaX
      if (Math.abs(acc) > 40) {
        locked = true
        stepRef.current(acc > 0 ? 1 : -1)
      }
    }
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement
      if (t.closest('input, textarea, [contenteditable]') || document.querySelector('.why, .confirm')) return
      if (e.key === 'ArrowLeft') stepRef.current(-1)
      else if (e.key === 'ArrowRight') stepRef.current(1)
    }
    window.addEventListener('wheel', onWheel, { passive: false })
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('wheel', onWheel)
      window.removeEventListener('keydown', onKey)
      clearTimeout(quiet)
    }
  }, [])

  // A quiet light-grey arrow either side of the square: tap to step a day (and the screen reader's day buttons).
  // The question, square and palette sit in the middle of the first screen. Placed by measuring, not by
  // filling the screen, so the notes follow right after the palette and the square never moves with them.
  const trio = useRef<HTMLDivElement>(null)
  const [lift, setLift] = useState<number>()
  useLayoutEffect(() => {
    const fit = () => {
      const el = trio.current
      if (!el) return
      const top = el.parentElement!.getBoundingClientRect().top + window.scrollY
      const band = document.querySelector('.zoombar')?.getBoundingClientRect().height ?? 0
      // Centred, but never more than 24px under the bar: the day sits high, the moments closer.
      setLift(Math.min(24, Math.max(12, (window.innerHeight - top - band - el.offsetHeight) / 2)))
    }
    fit()
    window.addEventListener('resize', fit)
    return () => window.removeEventListener('resize', fit)
  }, [])

  const peek = (iso: string, dir: -1 | 1) => (
    <button
      className="peek"
      aria-label={`${dir < 0 ? 'Previous' : 'Next'} day, ${longDate(iso)}`}
      onClick={() => step(dir)}
    >
      <Chevron dir={dir < 0 ? 'left' : 'right'} />
    </button>
  )

  // A moment, any time: "this moment…" while today is being lived, "add to today…" once it's painted, "add to this
  // day…" on any other day. Hidden while the bubble is open ("because…" right after painting, or updating a moment), but
  // it keeps its place, so the square doesn't jump. Under the palette (layout D, kept Nov 4, 2026: the square and the question lead).
  const momentSlot = (
    <div className={'moment-slot' + (why ? ' is-away' : '')} inert={!!why}>
      <MomentBox
        key={date}
        // "+" first, as an add-a-line row (Reminders' "+ New Reminder"), and a #tag, shown by example, always (nomi, Nov 4, 2026: nothing told you tags exist). #health, not #family: not
        // everyone has family; everyone has health.
        placeholder={'+ ' + (date !== today ? 'add to this day…' : day ? 'add to today…' : 'this moment…') + ' #health'}
        onAdd={(text, color) => void onSaveNote(undefined, text, color)}
      />
    </div>
  )
  return (
    <main className={'today' + (day ? ' is-closed' : '')}>
      <div
        className="today-stage"
        style={lift === undefined ? undefined : { paddingTop: lift }}
        onPointerDown={swipeDown}
        onPointerMove={swipeMove}
        onPointerUp={swipeUp}
        onPointerCancel={() => {
          swipe.current = null
          setPull(0)
        }}
      >
        <div className="today-trio" ref={trio}>
          {/* The day in the order it's lived: which day (its date in the top bar), a moment as it comes, then the
              question and the square to close it. */}
          <div className="day-nav">
            {/* Tap the date to find any day you've lived: which year (with your age), which month, which day. It sits in
                the middle of the top bar, between the logo and the menu. */}
            {barCenter &&
              createPortal(
                <div className={'day-nav is-in-bar' + (date === today ? ' is-today' : '')}>
                  <button className="day-pick" aria-label="Go to a day" onClick={() => setFinding(true)}>
                    {/* The day's paint, as a small dot (an empty ring until it's painted). */}
                    <span
                      className={'day-dot' + (day ? '' : ' is-blank')}
                      style={day ? { background: paintHex(day.color) } : undefined}
                      aria-hidden="true"
                    />
                    <DayLabel iso={date} slide={slide} turns={dayTurns} />
                    <ChevronDown />
                  </button>
                </div>,
                barCenter,
              )}
            <DayFinder
              open={finding}
              onClose={() => setFinding(false)}
              date={date}
              today={today}
              born={born}
              days={days}
              onPick={(iso) => {
                setFinding(false)
                setSlide(null)
                onDate(iso)
              }}
              onSetUp={props.onSetUp}
            />
          </div>

          {/* "Today" belongs to now: its tense follows the day ("am I spending…" until it's painted, "did I spend…" once
              it is); on any other day, the question asks about "this day". */}
          {/* The question and today's closing share one place, as tall as the taller of the two (the other sits there
              unseen), so painting today never moves the square. */}
          {/* The title area keeps one height on every day (the ghost holds a 2-line heading, the tallest), so the square
              never moves; whatever shows sits in its middle. */}
          <div className="day-head">
            {day && date === today && !answering ? (
              // Today, painted: the question is answered, so the day closes with one line, as the heading alone like
              // every painted day (nomi, Oct 29, 2026): always saying "today", never a verdict, pointing forward
              // (src/lib/pastWords.ts). "start over" brings the question back.
              <div className="day-closed">
                <h1 className="question">{signing ? <Signed text={words ?? ''} /> : words}</h1>
              </div>
            ) : day && date !== today && !answering ? (
              // A past day, painted: squared speaks back, the day's own words as the heading (2 lines at most), from its
              // colour's pool, the same each time you come back (src/lib/pastWords.ts), knowing where you stand.
              <div className="day-closed">
                <h1 className="question">{signing ? <Signed text={words ?? ''} /> : words}</h1>
              </div>
            ) : (
              // Unpainted, or just painted and still answering "because…": the question stays up, as asked.
              <Question text={questionFor(question, date === today, !!days[date] && !answering)} onDefine={onDefine} />
            )}
            <div className="day-head-ghost" aria-hidden="true" inert>
              <div className="day-closed">
                <h1 className="question">
                  two lines,
                  <br />a heading
                </h1>
              </div>
            </div>
          </div>

          <div
            className="easel"
            onPointerDown={() => {
              setWhispering(false)
              setTorn(false)
            }}
          >
            {hasPrev ? peek(prev, -1) : <span className="peek is-none" />}
            <div
              key={date}
              className={'easel-square' + (slide ? ` is-${slide}` : '') + (pull ? ' is-pulled' : '')}
              style={pull ? { transform: `translateX(${pull}px)` } : undefined}
            >
              <PaintCanvas
                key={date} // the same square while it's painted and saved (a rebuilt one can blink on iPhone)
                saved={day?.color}
                framed={day?.framed}
                marked={day?.outOfHands}
                loaded={loaded}
                onDryBrush={onDryBrush}
                onFilled={onFilled}
                blank={special ? `paint\n${blankSpecial(special.split(' · ')[0])}` : blankWord(date, today)}
                breathing={breathing}
              />
            </div>
            {hasNext ? peek(next, 1) : <span className="peek is-none" />}
          </div>

          {/* Painted the wrong day? A quiet way back to blank, right under the square. */}
          {day && !why && (
            <div className="day-links">
              <button className="day-wipe" onClick={() => setWiping(true)}>
                start over
              </button>
              {/* The rare ways to keep a day sit one step away, in a sheet that says what each does (nomi, Oct 30,
                  2026: three links under every day was a lot of choice). Start over stays one tap. */}
              <button className="day-wipe" onClick={() => setMoreOpen(true)}>
                more
              </button>
            </div>
          )}

          <div className="tray">
            {why ? (
              <WhyBubble
                key={`${why.note?.id ?? 'new'}:${why.n ?? 0}`}
                initial={why.draft ?? why.note?.body}
                original={why.note?.body}
                initialError={why.error}
                editing={!!why.note}
                onSave={(text) => onSaveNote(why.note, text)}
                onDelete={why.note ? () => onDeleteNote(why.note!) : undefined}
                onCancel={onCloseWhy}
                pinned={(why.pinned || why.note?.pinned) && !!day?.framed}
                isPinned={why.note?.pinned}
                happened={why.happened && !why.note}
                onPin={why.note ? () => props.onPinNote(why.note!) : undefined}
                paint={why.note?.color}
                onPaint={why.note ? (c) => props.onPaintNote(why.note!, c) : undefined}
                now={!day && date === today && !why.note}
                keep={keepIn(why)}
              />
            ) : (
              // A painted day is closed: the brush is put away ("start over" brings it back).
              !day && (
                <>
                  <Palette loaded={loaded} nudge={nudge} onLoad={dip} />
                  {/* Under the palette, in the gap above the moment box (so nothing moves): the dipped colour's
                      meaning, or, torn, a way to the torn sheet. */}
                  <div className="whisper-line" aria-live="polite">
                    {torn && !whispering ? (
                      <button className="whisper-torn" onClick={() => setCompassOpen(true)}>
                        torn? paint what won ›
                      </button>
                    ) : (
                      PAINTS.filter((x) => x.id === whisper?.paint).map((x) => (
                        <span key={x.id} className={'whisper-meaning' + (whispering ? ' is-on' : '')}>
                          <span className="legend-swatch" style={{ background: x.hex }} />
                          {x.meaning}
                        </span>
                      ))
                    )}
                  </div>
                </>
              )
            )}
          </div>
          {/* D: the moment box under the palette, right above the moments it adds to. */}
          {momentSlot}
        </div>
      </div>

      {/* Notes stay just as they were, below; kept mounted (hidden) while writing so opened notes stay open. */}
      <div className="tray-rest" hidden={!!why}>
        {/* The day's moments, newest first, to read back. */}
        {notes.length > 0 && (
          <NotesList
            key={date}
            notes={notes}
            framed={day?.framed ? day.color : undefined}
            onOpen={(n) => onOpenWhy(n)}
            onDelete={onDeleteNote}
          />
        )}
        {/* Torn has two reasons, so it asks both (nomi, Oct 30, 2026): was it mixed (what you said matters, one at a
            time, ‹ › to move through, never a scrolling list), or was it out of your hands. Each its own card. */}
        <Sheet open={compassOpen} onClose={() => setCompassOpen(false)}>
          {/* Short (nomi, Nov 4, 2026: two cards and a list of what matters were a lot to read): the advice, and the
              other reason a day is torn. */}
          <h2 className="torn-title">Torn?</h2>
          <p className="intro-how torn-line">Paint what won. Keep the rest in a moment.</p>
          {handsOn() && <p className="intro-how torn-line">Not your choice? Paint it, then more → out of my hands.</p>}
        </Sheet>
        {/* Someone's first visit: what a square is and what its colours mean, once. "got it" is a keyline, not the
            black main pill: dismissing a tip is never the day's main action (painting is). */}
        <Sheet open={introOpen} onClose={introDone}>
          <h2 className="torn-title">Each square is one day of your life.</h2>
          <ul className="intro-colours">
            {INTRO.map(([paint, line]) => (
              <li key={paint}>
                <span className="intro-dot" style={{ background: paintHex(paint) }} aria-hidden="true" />
                {line}
              </li>
            ))}
          </ul>
          <p className="intro-how">
            Add moments as they come.
            <br />
            Paint the square when the day is done.
          </p>
          <button className="pill is-keyline intro-done" onClick={introDone}>
            got it
          </button>
        </Sheet>
        <Sheet open={birthdayOpen} onClose={() => setBirthdayOpen(false)}>
          <h2 className="torn-title">
            <Raised text={age > 0 ? `Happy ${ordinal(age)} birthday.` : 'Happy birthday.'} />
          </h2>
          <p className="intro-how birthday-line">Today starts a new year of your life.</p>
          <p className="intro-how birthday-line">Be here for it. Spend it on what matters.</p>
          {/* A card, not a dialog: like the other sheets, a tap outside or a swipe down puts it away. */}
          <p className="birthday-sign">— nomi</p>
        </Sheet>
        <Sheet open={moreOpen} onClose={() => setMoreOpen(false)}>
          <h2 className="torn-title">Keep this day in a special way?</h2>
          <button
            className="more-row"
            onClick={() => {
              setMoreOpen(false)
              props.onFrame()
            }}
          >
            <span className="more-icon" aria-hidden="true">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3.5" y="3.5" width="17" height="17" rx="2" />
                <rect x="7.5" y="7.5" width="9" height="9" rx="1" />
              </svg>
            </span>
            <span>
              <b>{day?.framed ? 'unframe' : 'frame it'}</b>
              <span>
                {day?.framed
                  ? 'it leaves my days → framed. its moments stay.'
                  : 'a day worth keeping. it waits for you in my days → framed.'}
              </span>
            </span>
          </button>
          {(handsOn() || day?.outOfHands) && (
            <button
              className="more-row"
              onClick={() => {
                setMoreOpen(false)
                if (day?.outOfHands) props.onUnmarkHands()
                else props.onMarkHands()
              }}
            >
              <span className="more-icon" aria-hidden="true">
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.6"
                  strokeLinecap="round"
                  strokeOpacity=".7"
                >
                  <path d="M4 13 Q8 9 11 4" />
                  <path d="M5 20 Q12 14 18 5" />
                  <path d="M12 21 Q17 16 21 11" />
                </svg>
              </span>
              <span>
                <b>{day?.outOfHands ? 'unmark' : 'out of my hands'}</b>
                <span>
                  {day?.outOfHands
                    ? 'back to its colour’s own words. what happened stays.'
                    : 'some days aren’t up to you. your colour stays; the day is marked.'}
                </span>
              </span>
            </button>
          )}
        </Sheet>
        {wiping && (
          <ConfirmDialog
            title="Start this day over?"
            body="Its colour goes. Your moments for the day stay."
            confirm="start over"
            onConfirm={() => {
              setWiping(false)
              props.onWipe()
              fresh.current = date // a fresh start: the next dip breathes again
            }}
            onCancel={() => setWiping(false)}
          />
        )}
      </div>
      {/* The same bar as every square view (the switch, "today" in the centre on another day), and zoom out floating
          on the square, alone: a day is as close as it gets. Hidden while writing. */}
      {!why && (
        <ZoomBar
          onOut={onZoomOut}
          hint={monthHint ? 'see today in your month →' : undefined}
          listAt={() => date}
          today={() => {
            setSlide('from-right')
            onDate(today)
          }}
          here={
            date === today
              ? () => {
                  // You're here: the square gives a small pulse, so the eye lands on it.
                  const sq = document.querySelector('.easel .canvas')
                  sq?.classList.remove('is-pulse')
                  void (sq as HTMLElement | null)?.offsetWidth
                  sq?.classList.add('is-pulse')
                  setTimeout(() => sq?.classList.remove('is-pulse'), 950)
                }
              : undefined
          }
        />
      )}
    </main>
  )
}

/**
 * A line written in as you'd write it: word after word, so a two-line heading writes its first line, then its second
 * (nomi, Nov 5, 2026: revealed left to right, both lines came at once). About 2 seconds whatever its length.
 */
function Signed({ text }: { text: string }) {
  const words = text.split(' ')
  const step = 2000 / Math.max(1, words.length)
  return (
    <>
      {words.map((w, i) => (
        <span key={i} className="signed-word" style={{ animationDelay: `${Math.round(i * step)}ms` }}>
          {w}
          {i < words.length - 1 ? ' ' : ''}
        </span>
      ))}
    </>
  )
}

/** A small speaker: sound waves when on, a cross when muted — drawn like the bar's other icons. */
export function SpeakerIcon({ on }: { on: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M2.5 8.5 H7 L12.5 3.5 V20.5 L7 15.5 H2.5 Z" />
      {on ? (
        <path d="M16 8.5 C17.6 10.4 17.6 13.6 16 15.5 M19 5.5 C22.4 9.4 22.4 14.6 19 18.5" />
      ) : (
        <path d="M16 9 L22 15 M22 9 L16 15" />
      )}
    </svg>
  )
}

export function Chevron({ dir }: { dir: 'left' | 'right' }) {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d={dir === 'left' ? 'M15 5l-7 7 7 7' : 'M9 5l7 7-7 7'}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        vectorEffect="non-scaling-stroke"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

/** A small down chevron: the date opens a picker; a folded run of days opens. */
export function ChevronDown({ className = 'day-pick-chevron' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 12 12" aria-hidden="true">
      <path
        d="M3 4.5 L6 7.5 L9 4.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

/** "Sat, Oct 17th, 2026" with the "th" raised; read aloud in full. It slides in with its day. */
// The date, in a quiet capsule, rolls like a counter when you step a day: back a day, the new date comes down from
// above and the old one leaves below; forward, the other way. The one motion on the day (the square stays still).
function DayLabel({ iso, slide, turns }: { iso: string; slide: 'from-left' | 'from-right' | null; turns: boolean }) {
  const [shown, setShown] = useState(iso)
  const [leaving, setLeaving] = useState<string | null>(null)
  useEffect(() => {
    if (iso === shown) return
    setLeaving(slide ? shown : null)
    setShown(iso)
    const t = setTimeout(() => setLeaving(null), 340)
    return () => clearTimeout(t)
  }, [iso]) // eslint-disable-line react-hooks/exhaustive-deps
  const text = (d: string) => {
    const p = shortDateParts(d)
    return `${p.weekday}, ${p.monthDay}, ${p.year}`
  }
  // A new day begins (nomi, Nov 2, 2026; with the life bar on my days, the only "a day passes" moments): once a day, the
  // first time today is opened, the date turns over from yesterday's, like a day picker: only what changes rolls (the
  // weekday and the day, the month and year when they change). Always from yesterday, however long you were away. It
  // waits for the page to settle; stepping to another day ends it.
  const today = todayIso()
  const [turn, setTurn] = useState<'wait' | 'go' | null>(() => (turns && iso === today ? 'wait' : null))
  useEffect(() => {
    if (turn === 'wait') {
      let t = 0
      let f = requestAnimationFrame(() => {
        t = window.setTimeout(() => (f = requestAnimationFrame(() => setTurn('go'))), 400)
      })
      return () => {
        cancelAnimationFrame(f)
        clearTimeout(t)
      }
    }
    if (turn === 'go') {
      const t = setTimeout(() => setTurn(null), 1000)
      return () => clearTimeout(t)
    }
  }, [turn])
  useEffect(() => {
    if (iso !== today) setTurn(null)
  }, [iso]) // eslint-disable-line react-hooks/exhaustive-deps
  if (turn) {
    const a = shortDateParts(addDays(today, -1))
    const b = shortDateParts(today)
    const go = turn === 'go'
    return (
      <span className="day-roll" aria-label={longDate(iso)} aria-live="polite">
        <span className="day-label" aria-hidden="true">
          <span className="day-turn">
            <Turn from={a.weekday} to={b.weekday} go={go} />, <Turn from={a.monthDay} to={b.monthDay} go={go} />,{' '}
            <Turn from={String(a.year)} to={String(b.year)} go={go} />
          </span>
        </span>
      </span>
    )
  }
  const back = slide === 'from-left'
  return (
    <span className="day-roll" aria-label={longDate(iso)} aria-live="polite">
      {leaving && (
        <span className={'day-label ' + (back ? 'is-out-down' : 'is-out-up')} aria-hidden="true">
          {text(leaving)}
        </span>
      )}
      <span
        key={shown}
        className={'day-label' + (leaving ? (back ? ' is-in-down' : ' is-in-up') : '')}
        aria-hidden="true"
      >
        {text(shown)}
      </span>
    </span>
  )
}
