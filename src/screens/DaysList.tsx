import { useEffect, useLayoutEffect, useRef, useState, type MutableRefObject, type ReactNode } from 'react'
import { ZoomBar } from '../components/ZoomBar'
import { Sheet } from '../components/Sheet'
import { glide, pulse } from '../lib/backToToday'
import {
  addDays,
  firstDay,
  fromIso,
  longDate,
  monthCells,
  monthTitle,
  shortDateParts,
  todayIso,
  writtenWhen,
} from '../lib/dates'
import type { Day, Days } from '../lib/days'
import type { Note, Notes } from '../lib/notes'
import { frameVars, paintHex, squareFill, WORD, type Paint } from '../lib/paints'
import { specialDay } from '../lib/special'
import { monthsBetween, shiftMonth } from './Month'
import { PaintingButton } from '../components/PaintingButton'
import { ChevronDown } from './Today'
import { Raised } from '../components/Raised'

type Props = {
  days: Days
  notes: Notes
  /** Earliest day (the birth date), if known. */
  born?: string
  /** The day to open on: where you were looking when you switched to the list. */
  focus: string
  onPick: (iso: string) => void
  /** A month came into view: load its notes. */
  onMonthShown: (iso: string) => void
  /** A month's painting ("YYYY-MM"; this one so far): opens it, to look at and keep. */
  onPainting?: (month: string) => void
  /** Kept up to date with the day in the middle of the screen, so a zoom or a switch opens there. */
  mid: MutableRefObject<() => string>
  /** The life's own head — title, life glass and the years · months · days capsule — as on the squares. */
  head?: ReactNode
  /** Only the days of one colour (or the unpainted ones) — from a slice of the pie — and the way back to all. */
  only?: Only
  /** Choose what the list shows: one kind of day, or all (null). */
  onOnly?: (only: Only | null) => void
  /** "only with moments" needs every one, not just the months seen so far. */
  onAllNotes?: () => void
}

export type Only = Paint | 'unpainted' | 'framed' | 'notes'
/** The filter's choices, in the order the app always lists colours. */
const FILTERS: [Only | null, string][] = [
  [null, 'all days'],
  ['notes', 'with moments'],
  ['framed', 'framed'],
  ['green', 'worth it'],
  ['red', 'regret'],
  ['grey', 'a blur'],
  ['unpainted', 'unpainted'],
]

/** A filter row's mark: the colour's dot, a little frame, or an empty dashed square. */
function FilterMark({ id }: { id: Only | null }) {
  if (!id) return <span className="filter-mark is-all" aria-hidden="true" />
  if (id === 'unpainted') return <span className="filter-mark is-unpainted" aria-hidden="true" />
  if (id === 'framed') return <span className="filter-mark is-framed" aria-hidden="true" />
  if (id === 'notes') return <span className="filter-mark is-notes" aria-hidden="true" />
  return <span className="filter-mark" style={{ background: paintHex(id) }} aria-hidden="true" />
}

const WORD_OF: Record<Only, string> = { ...WORD, unpainted: 'unpainted', framed: 'framed', notes: 'with moments' }
/** About what two lines of a card's note hold on a phone. */
const PREVIEW_CHARS = 80
/** Months added at a time as you scroll toward either end. */
const STEP = 6
/** How close (px) to an end of the list before more months are added. */
const NEAR = 900

/**
 * One day in the list (and on framed days): a short card, its date with its year (a long page can scroll past the
 * month's heading) — its colour, date and word, when a late one was first painted, and the
 * latest note cut to two lines. A tap anywhere opens the day (as a square does); "more" opens the card in place
 * to show every note in full, when there's more to read.
 */
export function DayCard({
  iso,
  day,
  notes = [],
  today,
  born,
  onPick,
}: {
  iso: string
  day?: Day
  notes?: Note[]
  today: string
  born?: string
  onPick: (iso: string) => void
}) {
  const special = specialDay(iso, born)
  const [open, setOpen] = useState(false)
  // A framed day's pinned note ("to remember") is the one shown; otherwise the latest.
  const latest = notes.find((n) => n.pinned) ?? notes.at(-1)
  const { weekday, monthDay, suffix, year } = shortDateParts(iso)
  // More to read: older notes, or a latest one longer than its two-line preview (judged by its length).
  const more = notes.length > 1 || (!!latest && (latest.body.length > PREVIEW_CHARS || latest.body.includes('\n')))
  return (
    <article
      className={
        'day-card' + (day ? ' is-painted' : '') + (iso === today ? ' is-today' : '') + (day?.framed ? ' is-framed' : '')
      }
      data-iso={iso}
      style={day?.framed ? frameVars(day.color) : undefined}
    >
      <span
        className={'day-card-swatch' + (day?.framed ? ' is-framed' : '')}
        style={day ? { background: squareFill(day.color, day.framed) } : undefined}
        aria-hidden="true"
      />
      <div className="day-card-text">
        {/* The whole card is this button (stretched over it); "more" sits above it. */}
        <button className="day-card-open" aria-label={`Open ${longDate(iso)}`} onClick={() => onPick(iso)}>
          <span className="day-card-date">
            {weekday}, {monthDay}
            <sup>{suffix}</sup>, {year}
          </span>
          {/* A real space before the word, so on a narrow line " · worth it" can move down whole, never under the toggle. */}
          {day && (
            <>
              {' '}
              <span className="day-card-word">· {WORD[day.color]}</span>
            </>
          )}
        </button>
        {special && (
          <span className="day-card-special">
            <Raised text={special} />
          </span>
        )}
        {/* Only what's worth saying in a list: a late square, or one changed later (on time is the norm). */}
      </div>
      {/* More to read: "5 moments ⌄" on the date's line, at the right (short, so the date keeps its line); "show
          latest only ⌃" waits at the end, in the day screen's words. */}
      {more && !open && (
        <button className="day-card-see" aria-expanded={false} onClick={() => setOpen(true)}>
          {notes.length > 1 ? `${notes.length} moments` : 'show all'}
          <ChevronDown className="day-card-chevron" />
        </button>
      )}
      {/* The latest note under the square and date, the card's full width (more of it fits), two lines. */}
      {!open && latest && (
        <div className="day-card-preview">
          {latest.pinned && (
            <span className={'day-card-pin' + (day?.framed ? '' : ' is-plain')}>
              {day?.framed ? 'to remember' : 'pinned'}
            </span>
          )}
          <p className="day-card-note">{latest.body}</p>
        </div>
      )}
      {/* Open, the notes take the card's full width, each its own block: its time, then its words. */}
      {open && (
        <div className="day-card-notes">
          {[...notes.filter((n) => n.pinned), ...notes.filter((n) => !n.pinned)].map((n) => (
            <div key={n.id} className="day-card-entry">
              {n.pinned && (
                <span className={'day-card-pin' + (day?.framed ? '' : ' is-plain')}>
                  {day?.framed ? 'to remember' : 'pinned'}
                </span>
              )}
              <span className="day-card-time">{writtenWhen(n.writtenAt, iso)}</span>
              <p className="day-card-note is-full">{n.body}</p>
            </div>
          ))}
          <button className="day-card-more" aria-expanded={true} onClick={() => setOpen(false)}>
            {notes.length > 1 ? 'show latest only' : 'show less'}
            <ChevronDown className="day-card-chevron is-up" />
          </button>
        </div>
      )}
    </article>
  )
}

// A life, day by day: the days as a list of short cards, oldest at the top, today at the foot — the closest level
// of the list (its tabs switch to months or years), a view beside the pie. Only a window of months is drawn — the one you opened on and a few around it — and more
// are added as you scroll toward either end, so it opens at once however far back you are.
export function DaysList({
  days,
  notes,
  born,
  focus,
  onPick,
  onMonthShown,
  onPainting,
  mid,
  head,
  only,
  onOnly,
  onAllNotes,
}: Props) {
  useEffect(() => {
    if (only === 'notes') onAllNotes?.()
  }, [only]) // eslint-disable-line react-hooks/exhaustive-deps
  const [picking, setPicking] = useState(false)
  const today = todayIso()
  const current = shiftMonth(today, 0)
  const first = shiftMonth(firstDay(days, born), 0)
  // Open on the day you were looking at — but never ahead of today (nothing to list yet) or before birth.
  const at = focus > today ? today : born && focus < born ? born : focus
  const start = shiftMonth(at, 0)
  const [range, setRange] = useState(() => ({
    from: monthsBetween(first, start) > 1 ? shiftMonth(start, -1) : first,
    to: start < current ? shiftMonth(start, 1) : current,
  }))
  // Filtered, every month of the life is in (the empty ones stay hidden), so a framed day or a note from years back
  // shows without scrolling to it first; unfiltered, a window of months that grows as you scroll.
  const span = only ? { from: first, to: current } : range
  const months = Array.from({ length: monthsBetween(span.from, span.to) + 1 }, (_, i) => shiftMonth(span.from, i))
  const shown = (iso: string) =>
    !only ||
    (only === 'unpainted'
      ? !days[iso]
      : only === 'framed'
        ? !!days[iso]?.framed
        : only === 'notes'
          ? !!notes[iso]?.length
          : days[iso]?.color === only)
  const scroller = useRef<HTMLDivElement>(null)
  const heightBefore = useRef<number | null>(null) // set when months are added above, to keep your place
  const pending = useRef<string | null>(null) // a day to bring to the middle once it's drawn
  const [away, setAway] = useState(false)

  // Every day is its own card. Quiet days (unpainted, no moments, not today or yesterday, not a special day) that
  // follow one another lie in a stack ("Oct 13 – 20 · 8 unpainted"): tap it and they fan out as cards, "stack them
  // again" folds them back. A stack is known by its first day.
  const yesterday = addDays(today, -1)
  const quiet = (iso: string) =>
    !days[iso] && !notes[iso]?.length && iso !== today && iso !== yesterday && !specialDay(iso, born)
  const [open, setOpen] = useState<Set<string>>(() => new Set())
  const toggle = (first: string) =>
    setOpen((s) => {
      const next = new Set(s)
      if (next.has(first)) next.delete(first)
      else next.add(first)
      return next
    })
  /** A month's days as cards and stacks: a run of two or more quiet days becomes one stack. */
  const groups = (list: string[]): (string | string[])[] => {
    const out: (string | string[])[] = []
    let run: string[] = []
    const flush = () => {
      if (run.length > 1) out.push(run)
      else out.push(...run)
      run = []
    }
    for (const iso of list) {
      if (!only && quiet(iso)) run.push(iso)
      else {
        flush()
        out.push(iso)
      }
    }
    flush()
    return out
  }
  const card = (iso: string) => (
    <li key={iso}>
      <DayCard iso={iso} day={days[iso]} notes={notes[iso]} today={today} born={born} onPick={onPick} />
    </li>
  )
  const short = (iso: string) => fromIso(iso).toLocaleDateString('en-US', { month: 'short' })

  const centre = (iso: string, smooth = false) => {
    const el = scroller.current
    const card = el?.querySelector<HTMLElement>(`[data-iso="${iso}"]`)
    if (!el || !card) return
    const to = card.offsetTop - (el.clientHeight - card.offsetHeight) / 2
    if (smooth) glide(el, to, () => pulse(card))
    else el.scrollTop = to
  }

  // Open with the focus day at the top (the list starts where the squares' view started: today, a month's 1st, a
  // year's Jan 1); a day inside a stack lands on its stack. Today, the last card, sits as high as the list allows.
  // Moments load a moment later and make the cards above taller: until you touch the list, it keeps its place.
  const top = (iso: string) => {
    const el = scroller.current
    if (!el) return
    let card: HTMLElement | null = null
    for (const c of el.querySelectorAll<HTMLElement>('[data-iso]')) if (c.dataset.iso! <= iso) card = c
    if (card) el.scrollTop = card.offsetTop - 44 // room for its month's name above it
  }
  const touched = useRef(false)
  useLayoutEffect(() => top(at), []) // eslint-disable-line react-hooks/exhaustive-deps
  useLayoutEffect(() => {
    if (!touched.current) top(at)
  }, [notes]) // eslint-disable-line react-hooks/exhaustive-deps
  // Anything else that grows the cards late (the fonts arriving, a special day's line) moves it too: hold the place
  // through any change of size until you touch the list.
  useEffect(() => {
    const el = scroller.current
    if (!el) return
    const ro = new ResizeObserver(() => !touched.current && top(at))
    for (const child of el.children) ro.observe(child)
    return () => ro.disconnect()
  }, [range]) // eslint-disable-line react-hooks/exhaustive-deps

  // Months added above keep what you're reading in place; a day waiting to be centred is centred.
  useLayoutEffect(() => {
    const el = scroller.current
    if (el && heightBefore.current !== null) el.scrollTop += el.scrollHeight - heightBefore.current
    heightBefore.current = null
    if (pending.current) {
      centre(pending.current, true)
      pending.current = null
    }
    // Filtered, a few months may hold too little to scroll: keep adding older months until there's room to.
    if (el && only && el.scrollHeight <= el.clientHeight + NEAR && range.from > first) {
      heightBefore.current = el.scrollHeight
      const from = shiftMonth(range.from, -STEP * 4)
      setRange({ ...range, from: from < first ? first : from })
    }
  }, [range]) // eslint-disable-line react-hooks/exhaustive-deps

  // The months on the page bring their notes.
  useEffect(() => months.forEach(onMonthShown), [range]) // eslint-disable-line react-hooks/exhaustive-deps

  const onScroll = () => {
    const el = scroller.current
    if (!el || heightBefore.current !== null) return
    if (el.scrollTop < NEAR && range.from > first) {
      heightBefore.current = el.scrollHeight
      const from = shiftMonth(range.from, -STEP)
      setRange({ ...range, from: from < first ? first : from })
    } else if (el.scrollHeight - el.scrollTop - el.clientHeight < NEAR && range.to < current) {
      const to = shiftMonth(range.to, STEP)
      setRange({ ...range, to: to > current ? current : to })
    }
    const card = el.querySelector<HTMLElement>('.day-card.is-today')
    setAway(
      !card || card.offsetTop > el.scrollTop + el.clientHeight || card.offsetTop + card.offsetHeight < el.scrollTop,
    )
  }

  mid.current = () => {
    const el = scroller.current
    if (!el) return at
    const y = el.scrollTop + el.clientHeight / 2
    for (const card of el.querySelectorAll<HTMLElement>('.day-card'))
      if (card.offsetTop + card.offsetHeight > y) return card.dataset.iso!
    return today
  }

  // ◎: back to today, at the foot of the list (drawing its month first if it isn't on the page yet).
  const backToToday = () => {
    touched.current = true // it goes where you asked, not back to where the list opened
    if (range.to < current) {
      pending.current = today
      setRange({ from: shiftMonth(current, -1), to: current })
    } else centre(today, true)
    setAway(false)
  }

  return (
    <main className="days-list">
      {head ?? (
        <div className="life-head">
          <h1 className="life-title">a life</h1>
        </div>
      )}
      {/* The one filter: a quiet line under the zoom capsule; its choices open in a sheet. */}
      {onOnly && (
        <div className="days-filter">
          <button className="days-filter-open" onClick={() => setPicking(true)} aria-haspopup="dialog">
            {only ? `only ${WORD_OF[only]}` : 'all days'}
            <ChevronDown className="days-filter-chevron" />
          </button>
          {only && (
            <button className="days-filter-clear" onClick={() => onOnly(null)} aria-label="Show all days">
              ×
            </button>
          )}
        </div>
      )}
      {onOnly && (
        <Sheet open={picking} onClose={() => setPicking(false)}>
          <h2 className="sheet-title">show</h2>
          <ul className="filter-list">
            {FILTERS.map(([id, label]) => (
              <li key={id ?? 'all'}>
                <button
                  className={'filter-row' + (only === id || (!only && !id) ? ' is-on' : '')}
                  onClick={() => {
                    setPicking(false)
                    onOnly(id)
                  }}
                >
                  <FilterMark id={id} />
                  <span className="filter-label">{label}</span>
                  {(only === id || (!only && !id)) && <span aria-label="shown">✓</span>}
                </button>
              </li>
            ))}
          </ul>
        </Sheet>
      )}
      <div
        className="days-scroll"
        ref={scroller}
        onScroll={onScroll}
        onPointerDown={() => (touched.current = true)}
        onWheel={() => (touched.current = true)}
        onTouchStart={() => (touched.current = true)}
      >
        {/* A filter with nothing in it says so, rather than an empty page. */}
        {only && !months.some((m) => monthCells(m).some((iso) => !!iso && iso <= today && shown(iso))) && (
          <p className="days-empty">No days here yet.</p>
        )}
        {months.map((m) => {
          const list = monthCells(m).filter(
            (iso): iso is string => !!iso && iso <= today && (!born || iso >= born) && shown(iso),
          )
          return (
            <section key={m} className="days-month is-cards" data-key={m} hidden={!list.length}>
              <div className="ladder-label month-label">
                {/* Its name opens its painting, as in the month view. */}
                {onPainting && Object.keys(days).some((iso) => iso.startsWith(m.slice(0, 7))) ? (
                  <PaintingButton period={m.slice(0, 7)} label={monthTitle(m)} onOpen={onPainting} />
                ) : (
                  monthTitle(m)
                )}
              </div>
              <ol className="month-list day-cards">
                {groups(list).map((g) => {
                  if (typeof g === 'string') return card(g)
                  const first = g[0]
                  const last = g[g.length - 1]
                  if (open.has(first))
                    return [
                      ...g.map(card),
                      <li key={`${first}-fold`} className="day-stack-fold">
                        <button onClick={() => toggle(first)}>
                          stack them again
                          <ChevronDown className="day-card-chevron is-up" />
                        </button>
                      </li>,
                    ]
                  return (
                    <li key={`${first}-stack`} className="day-stack" data-iso={first}>
                      <button className="day-stack-top" aria-expanded={false} onClick={() => toggle(first)}>
                        <span className="day-card-swatch" aria-hidden="true" />
                        <span className="day-stack-label">
                          <b>
                            {short(first)} {Number(first.slice(8))} – {Number(last.slice(8))}
                          </b>{' '}
                          · {g.length} unpainted
                        </span>
                        <ChevronDown className="day-card-chevron" />
                      </button>
                    </li>
                  )
                })}
              </ol>
            </section>
          )
        })}
      </div>
      <ZoomBar onRecenter={away && !only ? backToToday : undefined} listAt={() => mid.current()} />
    </main>
  )
}
