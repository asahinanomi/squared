import { useEffect, useLayoutEffect, useRef, type MutableRefObject } from 'react'
import { ZoomBar } from '../components/ZoomBar'
import { firstDay, fromIso, isoDate, longDate, monthCells, monthTitle, todayIso, dayCaption } from '../lib/dates'
import type { Days } from '../lib/days'
import { useBackToToday } from '../lib/backToToday'
import { frameVars, squareFill } from '../lib/paints'
import { specialDay } from '../lib/special'
import { useLadderScroll } from '../lib/useLadderScroll'
import { PaintingButton } from '../components/PaintingButton'
import { Chevron } from './Today'

type Props = {
  days: Days
  /** Earliest month that can be shown (the birth date), if known. */
  born?: string
  /** Month to open on (zooming in from a life); otherwise the current month. */
  focus?: string
  onPick: (iso: string) => void
  /** Zoom in: back to the single square. */
  onIn: () => void
  /** Zoom out to a life, on the month in view. */
  onOut?: (at: string) => void
  /** Set to "the day in the middle of what's showing", for a pinch to zoom from (and reset when it closes). */
  mid?: MutableRefObject<() => string>
  /** Pinched in: bigger day squares (3 to a row) that print their full date. */
  zoomed?: boolean
  /** The day under the fingers when the zoom changed, kept where it was on screen. */
  anchor?: { iso?: string; y: number }
  /** Without a birth date, the months stop at your first square's year; this asks for one, to go further back. */
  onSetUp?: () => void
  /** A finished month's painting ("YYYY-MM"): opens it, to look at and keep. */
  onPainting?: (month: string) => void
}

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'] // Sunday first, as North American calendars

/** First of the month `n` months away from the month containing `iso`. */
export const shiftMonth = (iso: string, n: number) => {
  const d = fromIso(iso)
  return isoDate(new Date(d.getFullYear(), d.getMonth() + n, 1))
}
export const monthsBetween = (a: string, b: string) =>
  (Number(b.slice(0, 4)) - Number(a.slice(0, 4))) * 12 + Number(b.slice(5, 7)) - Number(a.slice(5, 7))

// My squares — your months, one after another in a single scroll, from the birth month
// down to this one (next month peeks in faintly below). Opens centred on this month.
export function Month({
  days,
  born,
  focus,
  onPick,
  onIn,
  onOut,
  zoomed = false,
  anchor,
  onPainting,
  onSetUp,
  mid,
}: Props) {
  const today = todayIso()
  const current = shiftMonth(today, 0)
  const first = shiftMonth(firstDay(days, born), 0)
  const maxBack = monthsBetween(first, current)
  // Only months that can be shown: a focus ahead of this month (zooming in from 2055 on a life) opens this month,
  // one before your first opens your first, so the title and the squares always agree.
  const start =
    !focus || shiftMonth(focus, 0) > current ? current : shiftMonth(focus, 0) < first ? first : shiftMonth(focus, 0)
  const { scroller, back, visible, onScroll, jumpTo } = useLadderScroll({
    maxBack,
    batch: 4, // a few months to open on (it opens faster); more are added as you scroll back
    focus: start,
    focusBack: monthsBetween(start, current),
  })

  const toToday = useBackToToday(scroller, '.month-day.is-today')
  // The middle of the month in view: where a zoom out (button or pinch) centres the life.
  const middle = () => `${visible.slice(0, 8)}15`
  if (mid) mid.current = middle
  useEffect(() => () => void (mid && (mid.current = todayIso)), [mid])
  const months = Array.from({ length: back + 1 }, (_, i) => shiftMonth(current, i - back))
  const step = (n: number) => {
    const target = shiftMonth(visible, n)
    jumpTo(target, monthsBetween(target, current))
  }
  const next = shiftMonth(current, 1)

  // After zooming, put the day that was under the fingers back under them — only on a zoom, never on
  // arrival (an old anchor would pull a freshly opened month away to wherever you last pinched).
  const arrived = useRef(false)
  useLayoutEffect(() => {
    if (!arrived.current) {
      arrived.current = true
      return
    }
    const el = scroller.current
    if (!el || !anchor) return
    const target =
      (anchor.iso && el.querySelector<HTMLElement>(`[data-iso="${anchor.iso}"]`)) ||
      el.querySelector<HTMLElement>(`[data-key="${visible}"]`)
    if (!target) return
    const r = target.getBoundingClientRect()
    el.scrollTop += r.top + r.height / 2 - anchor.y
  }, [zoomed]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <main className={'month' + (zoomed ? ' is-zoomed' : '')}>
      <div className="ladder-head">
        <button
          aria-label="Previous month"
          disabled={monthsBetween(visible, current) >= maxBack}
          onClick={() => step(-1)}
        >
          <Chevron dir="left" />
        </button>
        {/* The big title opens its month's painting too, the most obvious place for it. */}
        <h1 className="ladder-title">
          {onPainting && visible <= current && Object.keys(days).some((iso) => iso.startsWith(visible.slice(0, 7))) ? (
            <PaintingButton period={visible.slice(0, 7)} label={monthTitle(visible)} onOpen={onPainting} />
          ) : (
            monthTitle(visible)
          )}
        </h1>
        <button aria-label="Next month" disabled={visible >= current} onClick={() => step(1)}>
          <Chevron dir="right" />
        </button>
      </div>
      {/* Without a birth date: the way further back, under the title (where the capsule sits on the list). */}
      {!born && onSetUp && (
        <button className="ladder-setup" onClick={onSetUp}>
          set your birth date to go further back ›
        </button>
      )}
      <div className="month-grid is-weekdays" aria-hidden="true" hidden={zoomed}>
        {WEEKDAYS.map((d, i) => (
          <span key={i}>{d}</span>
        ))}
      </div>

      <div
        className="ladder-scroll"
        ref={scroller}
        onScroll={() => {
          onScroll()
          toToday.check()
        }}
      >
        {months.map((m) => (
          <section key={m} className="month-block" data-key={m}>
            <div className="ladder-label month-label">
              {/* A month with squares in it: its name opens its painting (this one so far). */}
              {onPainting && m <= current && Object.keys(days).some((iso) => iso.startsWith(m.slice(0, 7))) ? (
                <PaintingButton period={m.slice(0, 7)} label={monthTitle(m)} onOpen={onPainting} />
              ) : (
                monthTitle(m)
              )}
            </div>
            <div className="month-grid">
              {monthCells(m).map((iso, i) => {
                if (!iso) return zoomed ? null : <span key={`b${i}`} className="is-blank" />
                const day = days[iso]
                const fill = day ? squareFill(day.color, day.framed) : undefined
                const before = !!born && iso < born // not part of your life: faded, so your first day reads as day one
                return (
                  <button
                    key={iso}
                    className={
                      'month-day' +
                      (day ? ' is-painted' : '') +
                      (iso === today ? ' is-today' : '') +
                      (before ? ' is-before' : '') +
                      (day?.framed ? ' is-framed' : '')
                    }
                    style={fill ? { background: fill, ...(day?.framed ? frameVars(day.color) : {}) } : undefined}
                    disabled={iso > today || before}
                    aria-label={longDate(iso) + (specialDay(iso, born) ? `, ${specialDay(iso, born)}` : '')}
                    data-iso={iso}
                    onClick={() => onPick(iso)}
                  >
                    {!before && specialDay(iso, born) && <span className="month-special" aria-hidden="true" />}
                    <span className="month-num">{Number(iso.slice(8))}</span>
                    {/* Seven across, the row of weekday letters above says it; pinched in, each square says its date. */}
                    {zoomed && <span className="month-wd">{dayCaption(iso)}</span>}
                  </button>
                )
              })}
            </div>
          </section>
        ))}
        {/* Next month peeks in, faint: there's more ahead, not yet lived. */}
        <section className="month-block is-faint" aria-hidden="true">
          <div className="ladder-label month-label">{monthTitle(next)}</div>
          <div className="month-grid is-faint">
            {monthCells(next).map((d, i) =>
              d ? <span key={d}>{Number(d.slice(8))}</span> : <span key={`b${i}`} className="is-blank" />,
            )}
          </div>
        </section>
      </div>

      <ZoomBar
        onIn={onIn}
        onOut={onOut && (() => onOut(middle()))}
        onRecenter={toToday.away ? toToday.back : undefined}
        listAt={() => (toToday.away ? `${middle().slice(0, 8)}01` : todayIso())} // today if on screen, else the 1st
      />
    </main>
  )
}
