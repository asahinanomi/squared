import { useState } from 'react'
import { ZoomBar } from '../components/ZoomBar'
import { fromIso, isoDate, longDate, monthCells, monthTitle, shortWeekday, todayIso } from '../lib/dates'
import type { Days } from '../lib/days'
import { paintHex, paintTint } from '../lib/paints'
import { Chevron } from './Today'

type Props = {
  days: Days
  /** Earliest month that can be shown (the birth date), if known. */
  born?: string
  onPick: (iso: string) => void
  /** Zoom in: back to the single square. */
  onIn: () => void
  /** Zoom out to the year (absent until that level exists). */
  onOut?: () => void
}

const WEEKDAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S']

/** First of the month `n` months away from the month containing `iso`. */
const shiftMonth = (iso: string, n: number) => {
  const d = fromIso(iso)
  return isoDate(new Date(d.getFullYear(), d.getMonth() + n, 1))
}
const monthName = (iso: string) => fromIso(iso).toLocaleDateString('en-US', { month: 'long' })

// My squares — one month of days. Faint rows of the months before and after bleed off the
// edges to hint there's more. Always opens on the current month.
export function Month({ days, born, onPick, onIn, onOut }: Props) {
  const today = todayIso()
  const [month, setMonth] = useState(() => shiftMonth(today, 0))
  const prev = shiftMonth(month, -1)
  const next = shiftMonth(month, 1)
  const canPrev = !born || prev.slice(0, 7) >= born.slice(0, 7)
  const canNext = next.slice(0, 7) <= today.slice(0, 7)

  const faint = (iso: string, where: 'before' | 'after') => (
    <div className={`month-faint is-${where}`} aria-hidden="true">
      {where === 'after' && <div className="month-faint-label">{monthName(iso)}</div>}
      <div className="month-grid is-faint">
        {monthCells(iso).map((d, i) => (d ? <span key={d}>{Number(d.slice(8))}</span> : <span key={`b${i}`} className="is-blank" />))}
      </div>
      {where === 'before' && <div className="month-faint-label">{monthName(iso)}</div>}
    </div>
  )

  return (
    <main className="month">
      <div className="month-stage">
        {faint(prev, 'before')}
        <div className="month-main">
          <div className="month-head">
            <button aria-label="Previous month" disabled={!canPrev} onClick={() => setMonth(prev)}>
              <Chevron dir="left" />
            </button>
            <h1 className="month-title">{monthTitle(month)}</h1>
            <button aria-label="Next month" disabled={!canNext} onClick={() => setMonth(next)}>
              <Chevron dir="right" />
            </button>
          </div>
          <div className="month-grid is-weekdays" aria-hidden="true">
            {WEEKDAYS.map((d, i) => (
              <span key={i}>{d}</span>
            ))}
          </div>
          <div className="month-grid">
            {monthCells(month).map((iso, i) => {
              if (!iso) return <span key={`b${i}`} className="is-blank" />
              const day = days[iso]
              const fill = day ? (day.backfilled ? paintTint(day.color) : paintHex(day.color)) : undefined
              return (
                <button
                  key={iso}
                  className={'month-day' + (day ? ' is-painted' : '') + (iso === today ? ' is-today' : '')}
                  style={fill ? { background: fill } : undefined}
                  disabled={iso > today}
                  aria-label={longDate(iso)}
                  onClick={() => onPick(iso)}
                >
                  <span className="month-num">{Number(iso.slice(8))}</span>
                  <span className="month-wd">{shortWeekday(iso)}</span>
                </button>
              )
            })}
          </div>
        </div>
        {faint(next, 'after')}
      </div>
      <ZoomBar hint="tap a day to paint · pinch to zoom out" onIn={onIn} onOut={onOut} />
    </main>
  )
}
