import { PaintingThumb } from '../components/PaintingThumb'
import { monthsAgo, shortDateParts, todayIso } from '../lib/dates'
import { stampLine, type Days } from '../lib/days'
import { lifeCounts } from '../lib/life'
import type { Note, Notes } from '../lib/notes'
import { PAINTS, paintDeep, paintHex, squareFill, WORD } from '../lib/paints'
import type { Profile } from '../lib/profile'
import { Chevron } from './Today'

type Step = { label: string; done: boolean; go: () => void }

type Props = {
  name: string
  days: Days
  notes: Notes
  profile: Profile | null
  /** The few things squared needs (how many squares, a first square): shown while you're new (squares not set). */
  steps: Step[]
  /** What else squared can do, one tap each to try; a tried one leaves the list. */
  discover: { label: string; sub: string; swatch: React.CSSProperties; go: () => void }[]
  onToday: () => void
  onLife: () => void
  onDay: (iso: string) => void
  onPainting: (period: string) => void
}

const greeting = (name: string) => {
  const h = new Date().getHours()
  const part = h < 12 ? 'morning' : h < 18 ? 'afternoon' : 'evening'
  return `Good ${part}${name ? `, ${name}` : ''}.`
}
const fmt = (n: number) => n.toLocaleString('en-US')
const DateLine = ({ iso }: { iso: string }) => {
  const p = shortDateParts(iso)
  return (
    <>
      {p.weekday}, {p.monthDay}
      <sup>{p.suffix}</sup>
    </>
  )
}

// Home: where you land once today is painted (and on your first visits); the logo leads here any time. Before
// you paint, today leads: the question and "paint today". Then a month and a year ago today, your life in one
// line, and this month and year so far, as paintings. For someone new (how many squares not set yet): first steps
// and what to explore. Every
// card is a door. No streaks, no scores.
export function Home({ name, days, notes, profile, steps, discover, onToday, onLife, onDay, onPainting }: Props) {
  const today = todayIso()
  const painted = days[today]
  const firstNote = (iso: string): Note | undefined => (notes[iso] ?? []).find((n) => n.pinned) ?? notes[iso]?.at(-1)
  const ago = (
    [
      [1, 'a month ago today'],
      [12, 'a year ago today'],
    ] as const
  )
    .map(([n, label]) => ({ iso: monthsAgo(today, n), label }))
    .filter((a): a is { iso: string; label: (typeof a)['label'] } => !!a.iso && !!days[a.iso])
  const month = today.slice(0, 7)
  const year = today.slice(0, 4)
  const hasMonth = Object.keys(days).some((d) => d.startsWith(month))
  const hasYear = Object.keys(days).some((d) => d.startsWith(year))
  const count = (p: string) => Object.keys(days).filter((d) => d.startsWith(p) && d <= today).length
  // New: how many squares isn't set yet. First steps show until then.
  const stepsLeft = !profile

  const life =
    profile &&
    (() => {
      const c = lifeCounts(profile.born, profile.lifespan, today)
      const lived = Math.round((c.sofar / c.total) * 100)
      const all = Object.values(days)
      const by = PAINTS.map((p) => ({ p, n: all.filter((d) => d.color === p.id).length }))
      const paintedN = by.reduce((n, b) => n + b.n, 0)
      return (
        <button className="home-card home-life" onClick={onLife} aria-label={`a life: ${fmt(c.left)} days ahead`}>
          <span className="home-head">
            a life
            <Chevron dir="right" />
          </span>
          <span className="home-big">
            {fmt(c.left)}
            <small>days ahead</small>
          </span>
          <span className="home-bar" aria-hidden="true">
            <i style={{ width: `${(c.sofar / c.total) * 100}%` }} />
          </span>
          <span className="home-legend">
            <span>
              {fmt(c.sofar)} lived · {lived}%
            </span>
            <span>{100 - lived}% ahead</span>
          </span>
          {/* How the painted days split, among the days lived: each colour, then the unpainted rest. */}
          {paintedN > 0 && (
            <>
              <span className="home-shares" aria-hidden="true">
                {by.map(({ p, n }) => (
                  <i key={p.id} style={{ width: `${(n / Math.max(c.sofar, 1)) * 100}%`, background: p.soft }} />
                ))}
              </span>
              <span className="home-legend">
                <span>
                  {fmt(paintedN)} painted: {fmt(by[0].n)} mattered
                </span>
              </span>
            </>
          )}
        </button>
      )
    })()

  const todayCard = painted ? (
    <button className="home-card home-today" onClick={onToday}>
      <span className="home-sq" style={{ background: paintHex(painted.color) }} aria-hidden="true">
        <span style={{ color: paintDeep(painted.color) }}>{WORD[painted.color]}</span>
      </span>
      <span>
        <span className="home-t">
          <DateLine iso={today} />
        </span>
        <span className="home-s">{stampLine(today, painted)}</span>
        <span className="home-link">open today</span>
      </span>
    </button>
  ) : (
    <div className="home-card home-ask">
      <p className="home-blank">today is still blank</p>
      <p className="home-q">
        did I spend <u>Today</u> meaningfully?
      </p>
      <button className="pill" onClick={onToday}>
        paint today
      </button>
    </div>
  )

  return (
    <main className="home">
      <p className="home-greet">
        {stepsLeft && !Object.keys(days).length ? `Welcome${name ? `, ${name}` : ''}.` : greeting(name)}
      </p>

      {painted ? (
        <>
          {life}
          {todayCard}
        </>
      ) : (
        todayCard
      )}

      {stepsLeft && (
        <section className="home-card">
          <h2 className="home-head">first steps</h2>
          <ul className="home-steps">
            {steps.map((s) => (
              <li key={s.label}>
                <button onClick={s.go} disabled={s.done} className={s.done ? 'is-done' : undefined}>
                  <span className="home-box" aria-hidden="true" />
                  {s.label}
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {discover.length > 0 && (
        <section className="home-card">
          <h2 className="home-head">explore squared</h2>
          <ul className="home-discover">
            {discover.map((d) => (
              <li key={d.label}>
                <button onClick={d.go}>
                  <span className="home-swatch" style={d.swatch} aria-hidden="true" />
                  <span>
                    <b>{d.label}</b>
                    <small>{d.sub}</small>
                  </span>
                  <Chevron dir="right" />
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {ago.length > 0 && (
        <section className="home-card home-ago">
          {ago.map((a) => {
            const d = days[a.iso]
            const note = firstNote(a.iso)
            return (
              <button key={a.iso} onClick={() => onDay(a.iso)}>
                <span className="home-dot" style={{ background: squareFill(d.color, d.framed) }} aria-hidden="true" />
                <span>
                  <b>{a.label}</b>: {WORD[d.color]}
                  {note && <>. “{note.body}”</>}
                </span>
              </button>
            )
          })}
        </section>
      )}

      {!painted && life}

      {(hasMonth || hasYear) && (
        <section className="home-card home-paintings">
          {hasMonth && (
            <button onClick={() => onPainting(month)}>
              <span className="home-t">{new Date().toLocaleDateString('en-US', { month: 'long' })}, so far</span>
              <PaintingThumb month={month} days={days} />
              <span className="home-s">{count(month)} days painted</span>
            </button>
          )}
          {hasYear && (
            <button onClick={() => onPainting(year)}>
              <span className="home-t">{year}, so far</span>
              <PaintingThumb month={year} days={days} />
              <span className="home-s">{count(year)} days painted</span>
            </button>
          )}
        </section>
      )}
    </main>
  )
}
