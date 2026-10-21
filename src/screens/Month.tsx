import { useLayoutEffect, useRef } from 'react'
import { ZoomBar } from '../components/ZoomBar'
import { fromIso, isoDate, longDate, monthCells, monthTitle, shortWeekday, todayIso, dayCaption } from '../lib/dates'
import type { Days } from '../lib/days'
import { useBackToToday } from '../lib/backToToday'
import { paintHex, paintTint } from '../lib/paints'
import { specialDay } from '../lib/special'
import { useLadderScroll } from '../lib/useLadderScroll'
import { Chevron } from './Today'

type Props = {
  days: Days
  /** Earliest month that can be shown (the birth date), if known. */
  born?: string
  /** Month to open on (zooming in from a year); otherwise the current month. */
  focus?: string
  onPick: (iso: string) => void
  /** Zoom in: back to the single square. */
  onIn: () => void
  /** Zoom out to the year. */
  onOut?: () => void
  /** Pinched in: bigger day squares (3 to a row) that print their full date. */
  zoomed?: boolean
  /** The day under the fingers when the zoom changed, kept where it was on screen. */
  anchor?: { iso?: string; y: number }
}

const WEEKDAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S']

/** First of the month `n` months away from the month containing `iso`. */
export const shiftMonth = (iso: string, n: number) => {
  const d = fromIso(iso)
  return isoDate(new Date(d.getFullYear(), d.getMonth() + n, 1))
}
export const monthsBetween = (a: string, b: string) =>
  (Number(b.slice(0, 4)) - Number(a.slice(0, 4))) * 12 + Number(b.slice(5, 7)) - Number(a.slice(5, 7))

// My squares — your months, one after another in a single scroll, from the birth month
// down to this one (next month peeks in faintly below). Opens centred on this month.
export function Month({ days, born, focus, onPick, onIn, onOut, zoomed = false, anchor }: Props) {
  const today = todayIso()
  const current = shiftMonth(today, 0)
  const maxBack = born ? monthsBetween(shiftMonth(born, 0), current) : Infinity
  const start = focus ? shiftMonth(focus, 0) : current
  const { scroller, back, visible, onScroll, jumpTo } = useLadderScroll({
    maxBack,
    batch: 12,
    focus: start,
    focusBack: monthsBetween(start, current),
  })

  const toToday = useBackToToday(scroller, '.month-day.is-today')
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
        <h1 className="ladder-title">{monthTitle(visible)}</h1>
        <button aria-label="Next month" disabled={visible >= current} onClick={() => step(1)}>
          <Chevron dir="right" />
        </button>
      </div>
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
            <div className="ladder-label">{monthTitle(m)}</div>
            <div className="month-grid">
              {monthCells(m).map((iso, i) => {
                if (!iso) return zoomed ? null : <span key={`b${i}`} className="is-blank" />
                const day = days[iso]
                const fill = day ? (day.backfilled ? paintTint(day.color) : paintHex(day.color)) : undefined
                const before = !!born && iso < born // not part of your life: faded, so your first day reads as day one
                return (
                  <button
                    key={iso}
                    className={
                      'month-day' +
                      (day ? ' is-painted' : '') +
                      (iso === today ? ' is-today' : '') +
                      (before ? ' is-before' : '')
                    }
                    style={fill ? { background: fill } : undefined}
                    disabled={iso > today || before}
                    aria-label={longDate(iso) + (specialDay(iso, born) ? `, ${specialDay(iso, born)}` : '')}
                    data-iso={iso}
                    onClick={() => onPick(iso)}
                  >
                    {!before && specialDay(iso, born) && <span className="month-special" aria-hidden="true" />}
                    <span className="month-num">{Number(iso.slice(8))}</span>
                    <span className="month-wd">{zoomed ? dayCaption(iso) : shortWeekday(iso)}</span>
                  </button>
                )
              })}
            </div>
          </section>
        ))}
        {/* Next month peeks in, faint: there's more ahead, not yet lived. */}
        <section className="month-block is-faint" aria-hidden="true">
          <div className="ladder-label">{monthTitle(next)}</div>
          <div className="month-grid is-faint">
            {monthCells(next).map((d, i) =>
              d ? <span key={d}>{Number(d.slice(8))}</span> : <span key={`b${i}`} className="is-blank" />,
            )}
          </div>
        </section>
      </div>

      <ZoomBar
        onIn={onIn}
        onOut={onOut}
        onRecenter={toToday.away ? toToday.back : undefined}
        listAt={() => `${visible.slice(0, 8)}15`}
      />
    </main>
  )
}
