import { ZoomBar } from '../components/ZoomBar'
import { fromIso, isoDate, longDate, monthCells, monthTitle, shortWeekday, todayIso } from '../lib/dates'
import type { Days } from '../lib/days'
import { paintHex, paintTint } from '../lib/paints'
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
export function Month({ days, born, focus, onPick, onIn, onOut }: Props) {
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

  const months = Array.from({ length: back + 1 }, (_, i) => shiftMonth(current, i - back))
  const step = (n: number) => {
    const target = shiftMonth(visible, n)
    jumpTo(target, monthsBetween(target, current))
  }
  const next = shiftMonth(current, 1)

  return (
    <main className="month">
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
      <div className="month-grid is-weekdays" aria-hidden="true">
        {WEEKDAYS.map((d, i) => (
          <span key={i}>{d}</span>
        ))}
      </div>

      <div className="ladder-scroll" ref={scroller} onScroll={onScroll}>
        {months.map((m) => (
          <section key={m} className="month-block" data-key={m}>
            <div className="ladder-label">{monthTitle(m)}</div>
            <div className="month-grid">
              {monthCells(m).map((iso, i) => {
                if (!iso) return <span key={`b${i}`} className="is-blank" />
                const day = days[iso]
                const fill = day ? (day.backfilled ? paintTint(day.color) : paintHex(day.color)) : undefined
                return (
                  <button
                    key={iso}
                    className={'month-day' + (day ? ' is-painted' : '') + (iso === today ? ' is-today' : '')}
                    style={fill ? { background: fill } : undefined}
                    disabled={iso > today || (!!born && iso < born)}
                    aria-label={longDate(iso)}
                    onClick={() => onPick(iso)}
                  >
                    <span className="month-num">{Number(iso.slice(8))}</span>
                    <span className="month-wd">{shortWeekday(iso)}</span>
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

      <ZoomBar hint="tap a day to paint · pinch to zoom out" onIn={onIn} onOut={onOut} />
    </main>
  )
}
