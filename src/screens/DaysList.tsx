import { useEffect, useLayoutEffect, useRef, useState, type MutableRefObject, type ReactNode } from 'react'
import { ZoomBar } from '../components/ZoomBar'
import { glide, pulse } from '../lib/backToToday'
import { isoDate, longDate, monthCells, monthTitle, plainDate, shortDateParts, todayIso } from '../lib/dates'
import type { Day, Days } from '../lib/days'
import type { Note, Notes } from '../lib/notes'
import { paintHex, paintTint, type Paint } from '../lib/paints'
import { monthsBetween, shiftMonth } from './Month'

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
  /** Zoom in: today's square. */
  onIn: () => void
  /** Zoom out: the months. */
  onOut: () => void
  /** Kept up to date with the day in the middle of the screen, so a zoom or a switch opens there. */
  mid: MutableRefObject<() => string>
  /** The life's own head — title, life glass and the years · months · days capsule — as on the squares. */
  head?: ReactNode
  /** Only the days of one colour (or the unpainted ones) — from a slice of the pie — and the way back to all. */
  only?: Paint | 'unpainted'
  onAll?: () => void
}

const WORD: Record<Paint, string> = { green: 'mattered', red: 'empty', grey: 'slipped' }
const WORD_OF: Record<Paint | 'unpainted', string> = { ...WORD, unpainted: 'unpainted' }
/** About what two lines of a card's note hold on a phone. */
const PREVIEW_CHARS = 80
/** Months added at a time as you scroll toward either end. */
const STEP = 6
/** How close (px) to an end of the list before more months are added. */
const NEAR = 900

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
  onPick,
}: {
  iso: string
  day?: Day
  notes?: Note[]
  today: string
  onPick: (iso: string) => void
}) {
  const [open, setOpen] = useState(false)
  const latest = notes.at(-1)
  const { weekday, monthDay, suffix } = shortDateParts(iso)
  // More to read: older notes, or a latest one longer than its two-line preview (judged by its length).
  const more = notes.length > 1 || (!!latest && (latest.body.length > PREVIEW_CHARS || latest.body.includes('\n')))
  return (
    <article className={'day-card' + (day ? ' is-painted' : '') + (iso === today ? ' is-today' : '')} data-iso={iso}>
      <span
        className="day-card-swatch"
        style={day ? { background: day.backfilled ? paintTint(day.color) : paintHex(day.color) } : undefined}
        aria-hidden="true"
      />
      <div className="day-card-text">
        {/* The whole card is this button (stretched over it); "more" sits above it. */}
        <button className="day-card-open" aria-label={`Open ${longDate(iso)}`} onClick={() => onPick(iso)}>
          {weekday}, {monthDay}
          <sup>{suffix}</sup>
          {day && <span className="day-card-word"> · {WORD[day.color]}</span>}
        </button>
        {day?.backfilled && day.paintedOn && (
          <span className="day-card-painted">painted {plainDate(day.paintedOn)}</span>
        )}
        {open
          ? notes.map((n) => (
              <p key={n.id} className="day-card-note is-full">
                <span className="day-card-time">{writtenWhen(n.writtenAt, iso)}</span>
                {n.body}
              </p>
            ))
          : latest && <p className="day-card-note">{latest.body}</p>}
        {more && (
          <button className="day-card-more" aria-expanded={open} onClick={() => setOpen(!open)}>
            {open ? 'less ⌃' : notes.length > 1 ? `more · ${notes.length} notes ⌄` : 'more ⌄'}
          </button>
        )}
      </div>
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
  onIn,
  onOut,
  mid,
  head,
  only,
  onAll,
}: Props) {
  const today = todayIso()
  const current = shiftMonth(today, 0)
  const first = born ? shiftMonth(born, 0) : shiftMonth(today, -120)
  // Open on the day you were looking at — but never ahead of today (nothing to list yet) or before birth.
  const at = focus > today ? today : born && focus < born ? born : focus
  const start = shiftMonth(at, 0)
  const [range, setRange] = useState(() => ({
    from: monthsBetween(first, start) > 1 ? shiftMonth(start, -1) : first,
    to: start < current ? shiftMonth(start, 1) : current,
  }))
  const months = Array.from({ length: monthsBetween(range.from, range.to) + 1 }, (_, i) => shiftMonth(range.from, i))
  const shown = (iso: string) => !only || (only === 'unpainted' ? !days[iso] : days[iso]?.color === only)
  const scroller = useRef<HTMLDivElement>(null)
  const heightBefore = useRef<number | null>(null) // set when months are added above, to keep your place
  const pending = useRef<string | null>(null) // a day to bring to the middle once it's drawn
  const [away, setAway] = useState(false)

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
      {only && onAll && (
        <button className="days-only" onClick={onAll} aria-label={`Show all days, not only ${WORD_OF[only]}`}>
          {only !== 'unpainted' && <span className="days-only-dot" style={{ background: paintHex(only) }} />}
          only {WORD_OF[only]} <span aria-hidden="true">×</span>
        </button>
      )}
      <div className="days-scroll" ref={scroller} onScroll={onScroll}>
        {months.map((m) => {
          const list = monthCells(m).filter(
            (iso): iso is string => !!iso && iso <= today && (!born || iso >= born) && shown(iso),
          )
          return (
            <section key={m} className="days-month" data-key={m} hidden={!list.length}>
              <div className="ladder-label">{monthTitle(m)}</div>
              <ol className="month-list">
                {list.map((iso) => (
                  <li key={iso}>
                    <DayCard iso={iso} day={days[iso]} notes={notes[iso]} today={today} onPick={onPick} />
                  </li>
                ))}
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
