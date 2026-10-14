import { monthCells, monthTitle, todayIso } from '../lib/dates'
import type { Day } from '../lib/mock'
import { paintHex } from '../lib/paints'

type Props = { days: Record<string, Day>; onPick: (iso: string) => void }

const WEEKDAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S']

export function Calendar({ days, onPick }: Props) {
  const today = todayIso()
  return (
    <main className="calendar">
      <h1 className="month-title">{monthTitle(today)}</h1>
      <div className="cal-grid">
        {WEEKDAYS.map((d, i) => (
          <span key={i} className="cal-weekday">
            {d}
          </span>
        ))}
        {monthCells(today).map((iso, i) => {
          if (!iso) return <span key={`b${i}`} />
          const day = days[iso]
          const state = day ? 'is-painted' : iso === today ? 'is-today' : iso < today ? 'is-past' : 'is-future'
          return (
            <button
              key={iso}
              className={`cal-day ${state}` + (iso === today && day ? ' is-today' : '')}
              style={day ? { background: paintHex(day.color) } : undefined}
              onClick={() => onPick(iso)}
            >
              {Number(iso.slice(8))}
            </button>
          )
        })}
      </div>
      <p className="hint">tap a day to paint it</p>
    </main>
  )
}
