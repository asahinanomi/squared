import { addDays, fromIso, todayIso } from '../lib/dates'
import type { Days } from '../lib/days'
import { lifeCounts } from '../lib/life'
import { frameOf, squareFill } from '../lib/paints'
import type { Profile } from '../lib/profile'

const fmt = (n: number) => n.toLocaleString('en-US')
const ahead = (n: number) => (n === 0 ? 'today is the last' : n === 1 ? '1 day ahead' : `${fmt(n)} days ahead`)

type Props = {
  days: Days
  profile: Profile | null
  onDay: (iso: string) => void
  onMonth: () => void
  onLife: () => void
  onSetUp: () => void
}

// Where am I (the top of my days): this week, this month and a life, three scales of the same truth, the smaller
// ones easier to commit to. The week and the month as their own days, in their real paint (today ringed, the days
// ahead empty); a life as its bar (too many days to show). Never a score: where you are, not how well you're doing.
// Lab: https://claude.ai/artifact/8RNH3LHkF4RtJ3QchG5fkm (row 9, B)
export function WhereCard({ days, profile, onDay, onMonth, onLife, onSetUp }: Props) {
  const today = todayIso()
  const t = fromIso(today)
  const sunday = addDays(today, -t.getDay())
  const week = Array.from({ length: 7 }, (_, i) => addDays(sunday, i))
  const first = `${today.slice(0, 8)}01`
  const inMonth = new Date(t.getFullYear(), t.getMonth() + 1, 0).getDate()
  const month = Array.from({ length: inMonth }, (_, i) => addDays(first, i))
  const born = profile?.born
  const cell = (iso: string) => {
    const day = days[iso]
    const state = iso > today ? 'is-ahead' : iso === today ? 'is-today' : born && iso < born ? 'is-before' : ''
    return {
      className: 'where-cell ' + state,
      // Framed: its paint's deeper shade (a small square shows a frame as depth, not a ring).
      style: day && iso <= today ? { background: day.framed ? frameOf(day.color) : squareFill(day.color) } : undefined,
    }
  }
  const monthName = t.toLocaleDateString('en-US', { month: 'long' })
  const c = profile ? lifeCounts(profile.born, profile.lifespan, today) : null
  return (
    <section className="home-card where-card" aria-label="where you are">
      <div className="where-row">
        <div className="where-head">
          <span>this week</span>
          <small>{ahead(week.filter((d) => d > today).length)}</small>
        </div>
        <div className="where-cells is-week">
          {week.map((iso) =>
            iso <= today && (!born || iso >= born) ? (
              <button key={iso} {...cell(iso)} onClick={() => onDay(iso)} aria-label={`Open ${iso}`} />
            ) : (
              <span key={iso} {...cell(iso)} aria-hidden="true" />
            ),
          )}
        </div>
      </div>
      <button className="where-row" onClick={onMonth}>
        <span className="where-head">
          <span>{monthName}</span>
          <small>{ahead(inMonth - t.getDate())}</small>
        </span>
        <span className="where-cells is-month" aria-hidden="true">
          {month.map((iso) => (
            <span key={iso} {...cell(iso)} />
          ))}
        </span>
      </button>
      {c ? (
        <button className="where-row" onClick={onLife}>
          <span className="where-head">
            <span>a life</span>
            <small>{ahead(c.left)}</small>
          </span>
          <span className="where-track" aria-hidden="true">
            <i className="where-lived" style={{ width: `${(c.sofar / c.total) * 100}%` }} />
            <i className="where-now" />
            <i className="where-ahead" />
          </span>
        </button>
      ) : (
        <button className="where-row" onClick={onSetUp}>
          <span className="where-head">
            <span>a life</span>
            <small className="is-setup">set up now ›</small>
          </span>
          <span className="where-track is-ghost" aria-hidden="true">
            <i className="where-lived" style={{ width: '40%' }} />
            <i className="where-now" />
            <i className="where-ahead" />
          </span>
        </button>
      )}
    </section>
  )
}
