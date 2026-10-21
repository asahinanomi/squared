import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { NotesList } from '../components/NotesList'
import { Sheet } from '../components/Sheet'
import { PaintCanvas } from '../components/PaintCanvas'
import { Palette } from '../components/Palette'
import { Question } from '../components/Question'
import { WhyBubble } from '../components/WhyBubble'
import { ZoomInIcon, ZoomOutIcon } from '../components/ZoomBar'
import { addDays, longDate, ordinal, shortDateParts, todayIso } from '../lib/dates'
import { stampLine, type Days } from '../lib/days'
import type { Note, Why } from '../lib/notes'
import { PAINTS, paintHex, WORD, type Paint } from '../lib/paints'
import { setSoundOn, soundOn } from '../lib/sound'
import { loadMatters } from '../lib/matters'
import { specialDay } from '../lib/special'

type Props = {
  question: string
  /** Birth date, if known: the earliest day you can step back to. */
  born?: string
  date: string
  days: Days
  notes: Note[]
  loaded: Paint | null
  /** The open "why?" bubble: a new note, or an existing note being edited. */
  why: Why | null
  nudge: boolean
  onDate: (iso: string) => void
  /** Wipe the day's square back to blank (after a confirm). */
  onWipe: () => void
  /** Frame (or unframe) a day that mattered most. */
  onFrame: () => void
  onLoad: (p: Paint) => void
  onDefine: () => void
  /** Saves a new note, or updates `note` (instantly; a failure reopens the box). */
  onSaveNote: (note: Note | undefined, text: string) => Promise<void>
  onDeleteNote: (note: Note) => Promise<void>
  onCloseWhy: () => void
  onOpenWhy: (note?: Note) => void
  onDryBrush: () => void
  onFilled: (p: Paint) => void
  /** Zoom out to the month. */
  onZoomOut: () => void
  /** Off to settings → what matters, to edit the compass. */
  onMatters: () => void
}

export function Today(props: Props) {
  const { question, born, date, days, notes, loaded, why, nudge, onDate, onLoad, onDefine, onDryBrush, onFilled } =
    props
  const { onSaveNote, onDeleteNote, onCloseWhy, onOpenWhy, onZoomOut } = props
  const today = todayIso()
  const prev = addDays(date, -1)
  const next = addDays(date, 1)
  const day = days[date]
  const special = specialDay(date, born)
  // Just painted: which of this month's days of that colour it is — "your 3rd mattered day this month".
  const reveal = (paint: Paint, fresh: boolean) => {
    const month = date.slice(0, 7)
    const n = Object.entries(days).filter(([iso, d]) => iso.startsWith(month) && d.color === paint).length
    return n ? { text: `your ${ordinal(n)} ${WORD[paint]} day this month`, fresh } : undefined
  }

  // On each dip, the color's meaning whispers under the palette, then fades (sooner if painting starts).
  const [whisper, setWhisper] = useState<{ paint: Paint; at: number } | null>(null)
  const [whispering, setWhispering] = useState(false)
  const [wiping, setWiping] = useState(false)
  const [sound, setSound] = useState(soundOn)
  useEffect(() => {
    if (!whisper) return
    setWhispering(true)
    const t = setTimeout(() => setWhispering(false), 3500)
    return () => clearTimeout(t)
  }, [whisper])
  // Torn between green and red: on the third dip into them (both among them), whatever the brush held before,
  // a question to settle it, and your own compass. Grey dips don't count.
  const dips = useRef<Paint[]>([])
  const [torn, setTorn] = useState(false)
  useEffect(() => {
    dips.current = []
    setTorn(false)
  }, [date])
  const dip = (p: Paint) => {
    onLoad(p)
    setWhisper({ paint: p, at: Date.now() })
    if (p === 'grey') return
    const d = (dips.current = [...dips.current, p])
    if (d.length >= 3 && d.includes('green') && d.includes('red')) setTorn(true)
  }
  // Your own "mattered" entries; one is shown (the same all day, so it doesn't flicker), all in a sheet.
  const compass = torn
    ? loadMatters()
        .meaningful.map((e) => e.text.trim())
        .filter(Boolean)
    : []
  const pick = [...date].reduce((h, ch) => h + ch.charCodeAt(0), 0)
  const [compassOpen, setCompassOpen] = useState(false)
  useEffect(() => setCompassOpen(false), [date])

  // Day by day, sideways: yesterday waits on the left, tomorrow (until today) on the right.
  const hasPrev = !born || prev >= born
  const hasNext = next <= today
  const [slide, setSlide] = useState<'from-left' | 'from-right' | null>(null)
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
    if (t.closest('.paint-reach, .why')) return
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
      const band = document.querySelector('.today-zoom')?.getBoundingClientRect().height ?? 0
      setLift(Math.max(20, (window.innerHeight - top - band - el.offsetHeight) / 2))
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

  return (
    <main className="today">
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
          {/* "Today" belongs to now: on any other day, the question asks about "this day" — the date under it. */}
          <Question
            text={date === today ? question : question.replace(/\bToday\b/, 'this\u00a0day')}
            onDefine={onDefine}
          />

          <div className="day-nav">
            {/* Tap the date to jump to any day you've lived: the phone's own date picker, birth to today. */}
            <label className="day-pick">
              <DayLabel key={date} iso={date} slide={slide} />
              <ChevronDown />
              <input
                type="date"
                aria-label="Go to a day"
                min={born}
                max={today}
                value={date}
                onChange={(e) => {
                  // Clamp, never refuse: iPhone's wheels change the year first, keeping today's month and day,
                  // so 1971 can first arrive as a day before you were born — it lands on your birthday instead.
                  let iso = e.target.value
                  if (!iso) return
                  if (born && iso < born) iso = born
                  if (iso > today) iso = today
                  setSlide(null)
                  onDate(iso)
                }}
                onClick={(e) => {
                  try {
                    e.currentTarget.showPicker()
                  } catch {
                    /* older browsers open it themselves */
                  }
                }}
              />
            </label>
          </div>
          {special && <p className="day-special">{special}</p>}

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
                key={`${date}:${day?.color ?? ''}`}
                saved={day?.color}
                framed={day?.framed}
                stamp={day && stampLine(date, day)}
                loaded={loaded}
                onDryBrush={onDryBrush}
                onFilled={onFilled}
                blank={date === today ? 'paint your day' : 'paint this day'}
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
              {/* A day that mattered most: framed in a darker green. Green days only. */}
              {day.color === 'green' && (
                <button className="day-wipe" onClick={props.onFrame} aria-pressed={!!day.framed}>
                  {day.framed ? 'unframe' : 'frame this day'}
                </button>
              )}
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
                reveal={why.settled && reveal(why.settled, !!why.fresh)}
                pinned={why.pinned || why.note?.pinned}
              />
            ) : (
              <>
                <Palette loaded={loaded} nudge={nudge} onLoad={dip} />
                <p className={'whisper' + (whispering ? ' is-on' : '')} aria-live="polite">
                  {whisper && (
                    <>
                      <span className="whisper-dot" style={{ background: paintHex(whisper.paint) }} />
                      {PAINTS.find((x) => x.id === whisper.paint)!.meaning}
                    </>
                  )}
                </p>
                {torn && (
                  <div className="torn" aria-live="polite">
                    <p className="torn-ask">torn? ask yourself:</p>
                    <p className="torn-question">did what mattered outweigh the rest?</p>
                    {/* Your compass: one line here, all of it in a sheet, so the day never grows. */}
                    {compass.length ? (
                      <>
                        <p className="torn-mine">
                          <span className="torn-pick">you said: “{compass[pick % compass.length]}”</span>
                          {compass.length > 1 && (
                            <button onClick={() => setCompassOpen(true)}>see all {compass.length}</button>
                          )}
                        </p>
                      </>
                    ) : (
                      <p className="torn-mine">name what matters to you in settings → what matters</p>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Notes stay just as they were, below; kept mounted (hidden) while writing so opened notes stay open. */}
      <div className="tray-rest" hidden={!!why}>
        {(day || notes.length > 0) && (
          <NotesList
            key={date}
            notes={notes}
            onOpen={(n) => onOpenWhy(n)}
            onAdd={() => onOpenWhy()}
            onDelete={onDeleteNote}
          />
        )}
        <Sheet open={compassOpen} onClose={() => setCompassOpen(false)}>
          <h2 className="sheet-title">what matters to you</h2>
          <p className="compass-sub">you said these matter to you</p>
          <button className="compass-edit" onClick={props.onMatters}>
            edit in settings → what matters
          </button>
          <hr className="compass-rule" />
          <ul className="compass-list">
            {compass.map((text, i) => (
              <li key={i}>
                <span className="compass-dot" style={{ background: paintHex('green') }} aria-hidden="true" />
                {text}
              </li>
            ))}
          </ul>
          <button className="pill" onClick={() => setCompassOpen(false)}>
            close
          </button>
        </Sheet>
        {wiping && (
          <ConfirmDialog
            title="Start this day over?"
            body="Its colour goes. Your notes for the day stay."
            confirm="start over"
            onConfirm={() => {
              setWiping(false)
              props.onWipe()
            }}
            onCancel={() => setWiping(false)}
          />
        )}
      </div>
      {/* The zoom pair, as on every other level (hidden while writing). */}
      {!why && (
        <div className="today-zoom">
          {/* Sound on or off, one tap from painting (the same switch as in settings). */}
          <button
            className="today-sound"
            aria-label={sound ? 'Sound on: tap to mute' : 'Sound off: tap to turn on'}
            aria-pressed={sound}
            onClick={() => {
              setSoundOn(!sound)
              setSound(!sound)
            }}
          >
            <SpeakerIcon on={sound} />
          </button>
          {/* On a past day, the way back to today, in the centre as on every other bar. */}
          {date !== today && (
            <button
              className="zoombar-today"
              onClick={() => {
                setSlide('from-right')
                onDate(today)
              }}
            >
              today
            </button>
          )}
          <button aria-label="Zoom out" onClick={onZoomOut}>
            <ZoomOutIcon />
          </button>
          {/* Already as close as it gets: shown, greyed, like the far end of the ladder. */}
          <button aria-label="Zoom in" disabled>
            <ZoomInIcon />
          </button>
        </div>
      )}
    </main>
  )
}

/** A small speaker: sound waves when on, a cross when muted — drawn like the bar's other icons. */
function SpeakerIcon({ on }: { on: boolean }) {
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
function DayLabel({ iso, slide }: { iso: string; slide: 'from-left' | 'from-right' | null }) {
  const p = shortDateParts(iso)
  return (
    <span className={'day-label' + (slide ? ` is-${slide}` : '')} aria-label={longDate(iso)} aria-live="polite">
      <span aria-hidden="true">
        {p.weekday}, {p.monthDay}
        <sup>{p.suffix}</sup>, {p.year}
      </span>
    </span>
  )
}
