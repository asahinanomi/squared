import { Fragment, useEffect, useLayoutEffect, useRef, useState, type MutableRefObject, type ReactNode } from 'react'
import { ZoomBar } from '../components/ZoomBar'
import { Sheet } from '../components/Sheet'
import { glide, pulse } from '../lib/backToToday'
import {
  addDays,
  firstDay,
  isoDate,
  longDate,
  monthCells,
  monthTitle,
  plainDate,
  shortDateParts,
  todayIso,
} from '../lib/dates'
import type { Day, Days } from '../lib/days'
import type { Note, Notes } from '../lib/notes'
import { frameVars, paintHex, squareFill, WORD, type Paint } from '../lib/paints'
import { specialDay } from '../lib/special'
import { monthsBetween, shiftMonth } from './Month'
import { PaintingButton } from '../components/PaintingButton'
import { ChevronDown } from './Today'

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
  /** Zoom in: today's square. */
  onIn: () => void
  /** Zoom out: the months. */
  onOut: () => void
  /** Kept up to date with the day in the middle of the screen, so a zoom or a switch opens there. */
  mid: MutableRefObject<() => string>
  /** The life's own head — title, life glass and the years · months · days capsule — as on the squares. */
  head?: ReactNode
  /** Only the days of one colour (or the unpainted ones) — from a slice of the pie — and the way back to all. */
  only?: Only
  /** Choose what the list shows: one kind of day, or all (null). */
  onOnly?: (only: Only | null) => void
  /** A framed card's "framed" tag: framed days. */
  onFramedDays?: () => void
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

/** A run of unpainted days, folded into one quiet gap marker: "┈ Sep 14 – 21 · 8 unpainted days ⌄ ┈". */
function Fold({ run, open, onToggle }: { run: string[]; open: boolean; onToggle: () => void }) {
  const from = shortDateParts(run[0])
  const to = shortDateParts(run.at(-1)!)
  const sameMonth = run[0].slice(0, 7) === run.at(-1)!.slice(0, 7)
  return (
    <button className="day-fold" aria-expanded={open} onClick={onToggle}>
      <span className="day-fold-text">
        {from.monthDay} – {sameMonth ? to.monthDay.split(' ')[1] : to.monthDay} · {run.length} unpainted days
      </span>
      <ChevronDown className={'day-fold-chevron' + (open ? ' is-open' : '')} />
    </button>
  )
}

/** When a note was written: the time, or the date too if it was written on another day. */
function writtenWhen(at: string, iso: string) {
  const d = new Date(at)
  const time = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }).toLowerCase()
  return isoDate(d) === iso ? time : `${plainDate(isoDate(d))} · ${time}`
}

/**
 * One day in the list: a short card — its colour, date and word, when a late one was first painted, and the
 * latest note cut to two lines. A tap anywhere opens the day (as a square does); "more" opens the card in place
 * to show every note in full, when there's more to read.
 */
function DayCard({
  iso,
  day,
  notes = [],
  today,
  born,
  onPick,
  onFramed,
}: {
  iso: string
  day?: Day
  notes?: Note[]
  today: string
  born?: string
  onPick: (iso: string) => void
  onFramed?: () => void
}) {
  const special = specialDay(iso, born)
  const [open, setOpen] = useState(false)
  // A framed day's pinned note ("to remember") is the one shown; otherwise the latest.
  const latest = notes.find((n) => n.pinned) ?? notes.at(-1)
  const { weekday, monthDay, suffix } = shortDateParts(iso)
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
          {weekday}, {monthDay}
          <sup>{suffix}</sup>
          {day && <span className="day-card-word"> · {WORD[day.color]}</span>}
        </button>
        {/* A framed day: a small tag that shows only the framed ones. */}
        {day?.framed && onFramed && (
          <button className="day-card-framed" onClick={onFramed} aria-label="Open framed days">
            framed
          </button>
        )}
        {special && <span className="day-card-special">{special}</span>}
        {/* Only what's worth saying in a list: a late square, or one changed later (on time is the norm). */}
      </div>
      {/* The latest note under the square and date, the card's full width (more of it fits), two lines. */}
      {!open && latest && (
        <div className="day-card-preview">
          {latest.pinned && (
            <span className={'day-card-pin' + (day?.framed ? '' : ' is-plain')}>
              {day?.framed ? 'to remember' : 'pinned'}
            </span>
          )}
          <p className="day-card-note">{latest.body}</p>
          {more && (
            <button className="day-card-more" aria-expanded={false} onClick={() => setOpen(true)}>
              {notes.length > 1 ? `more · ${notes.length} moments ⌄` : 'more ⌄'}
            </button>
          )}
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
            less ⌃
          </button>
        </div>
      )}
    </article>
  )
}

// A life, day by day: the days as a list of short cards, oldest at the top, today at the foot — the closest level
// of the list (zoom out for months, then years), a view beside the pie. Only a window of months is drawn — the one you opened on and a few around it — and more
// are added as you scroll toward either end, so it opens at once however far back you are.
export function DaysList({
  days,
  notes,
  born,
  focus,
  onPick,
  onMonthShown,
  onPainting,
  onIn,
  onOut,
  mid,
  head,
  only,
  onOnly,
  onFramedDays,
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

  // Runs of unpainted days (no notes, not today or yesterday, not a special day) fold into one quiet row, so the
  // painted days read like a journal. A tap opens a run; the run you opened the list on starts open.
  const yesterday = addDays(today, -1)
  const quiet = (iso: string) =>
    !days[iso] && !notes[iso]?.length && iso !== today && iso !== yesterday && !specialDay(iso, born)
  const runs = (list: string[]) => {
    const out: string[][] = []
    for (const iso of list) {
      const last = out.at(-1)
      if (quiet(iso) && last && quiet(last[0])) last.push(iso)
      else out.push([iso])
    }
    return out
  }
  const [open, setOpen] = useState<Set<string>>(() => {
    const month = monthCells(start).filter((iso): iso is string => !!iso && iso <= today && (!born || iso >= born))
    const mine = runs(month).find((run) => run.includes(at))
    return new Set(mine ? [mine[0]] : [])
  })
  const toggle = (key: string) =>
    setOpen((s) => {
      const next = new Set(s)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })

  const centre = (iso: string, smooth = false) => {
    const el = scroller.current
    const card = el?.querySelector<HTMLElement>(`[data-iso="${iso}"]`)
    if (!el || !card) return
    const to = card.offsetTop - (el.clientHeight - card.offsetHeight) / 2
    if (smooth) glide(el, to, () => pulse(card))
    else el.scrollTop = to
  }

  // Open on the focus day, in the middle.
  useLayoutEffect(() => centre(at), []) // eslint-disable-line react-hooks/exhaustive-deps

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
      <div className="days-scroll" ref={scroller} onScroll={onScroll}>
        {/* A filter with nothing in it says so, rather than an empty page. */}
        {only && !months.some((m) => monthCells(m).some((iso) => !!iso && iso <= today && shown(iso))) && (
          <p className="days-empty">No days here yet.</p>
        )}
        {months.map((m) => {
          const list = monthCells(m).filter(
            (iso): iso is string => !!iso && iso <= today && (!born || iso >= born) && shown(iso),
          )
          return (
            <section key={m} className="days-month is-card" data-key={m} hidden={!list.length}>
              <div className="ladder-label month-label">
                {monthTitle(m)}
                {/* As in the month view: the month's painting, at the right edge. */}
                {onPainting && Object.keys(days).some((iso) => iso.startsWith(m.slice(0, 7))) && (
                  <PaintingButton period={m.slice(0, 7)} label={monthTitle(m)} onOpen={onPainting} />
                )}
              </div>
              <ol className="month-list">
                {runs(list).map((run) =>
                  run.length > 1 && !open.has(run[0]) ? (
                    <li key={run[0]}>
                      <Fold run={run} open={false} onToggle={() => toggle(run[0])} />
                    </li>
                  ) : (
                    <Fragment key={run[0]}>
                      {run.length > 1 && (
                        <li>
                          <Fold run={run} open onToggle={() => toggle(run[0])} />
                        </li>
                      )}
                      {run.map((iso) => (
                        <li key={iso}>
                          <DayCard
                            iso={iso}
                            day={days[iso]}
                            notes={notes[iso]}
                            today={today}
                            born={born}
                            onPick={onPick}
                            onFramed={onFramedDays}
                          />
                        </li>
                      ))}
                    </Fragment>
                  ),
                )}
              </ol>
            </section>
          )
        })}
      </div>
      <ZoomBar
        onIn={onIn}
        onOut={onOut}
        onRecenter={away && !only ? backToToday : undefined}
        listAt={() => mid.current()}
      />
    </main>
  )
}
