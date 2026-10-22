import { PaintingThumb } from '../components/PaintingThumb'
import { addDays, shortDateParts, todayIso } from '../lib/dates'
import { stampLine, type Days } from '../lib/days'
import { lifeCounts } from '../lib/life'
import type { Notes } from '../lib/notes'
import { PAINTS, paintDeep, paintHex, WORD } from '../lib/paints'
import type { Profile } from '../lib/profile'
import { OnThisDay } from '../components/OnThisDay'
import { Chevron } from './Today'

type Step = { label: string; done: boolean; go: () => void }

type Props = {
  name: string
  days: Days
  notes: Notes
  profile: Profile | null
  /** Getting started (onboarding's steps and the first square): shown until the first square is painted. */
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

// Home: where you land once today is painted (and when nothing is painted yet); the logo leads here any time.
// Before you paint, today leads: the question and "paint today". Then a month and a year ago today, your life in
// one line, and this month and year so far, as paintings. Every card is a door. No streaks, no scores.
// Before the first square (squares set, nothing painted): only your days ahead, the question with "paint your
// first square", and getting started, so there's one thing to do. Lab: https://claude.ai/artifact/EJ5eciFVqMwawnNmeDbezr (K)
export function Home({ name, days, notes, profile, steps, discover, onToday, onLife, onDay, onPainting }: Props) {
  const today = todayIso()
  const painted = days[today]
  const month = today.slice(0, 7)
  const year = today.slice(0, 4)
  const hasMonth = Object.keys(days).some((d) => d.startsWith(month))
  const hasYear = Object.keys(days).some((d) => d.startsWith(year))
  const count = (p: string) => Object.keys(days).filter((d) => d.startsWith(p) && d <= today).length
  // Before the first square: squares set, nothing painted (wiping the only square brings it back).
  const first = !!profile && Object.keys(days).length === 0

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

  if (first) {
    const yesterday = addDays(today, -1)
    const done = steps.filter((st) => st.done).length
    return (
      <main className="home">
        <p className="home-greet">{greeting(name)}</p>
        <div className="home-hero">
          <p className="home-hero-n">{fmt(lifeCounts(profile.born, profile.lifespan, today).left)}</p>
          <p className="home-hero-c">days ahead of you</p>
          <p className="home-hero-m">Make each one meaningful, starting with today.</p>
        </div>
        <div className="home-card home-ask">
          <p className="home-q">
            did I spend <u>Today</u> meaningfully?
          </p>
          <button className="pill" onClick={onToday}>
            paint your first square
          </button>
          {yesterday >= profile.born && (
            <button className="home-yesterday" onClick={() => onDay(yesterday)}>
              or paint yesterday
            </button>
          )}
        </div>
        <section className="home-card">
          <h2 className="home-head">
            getting started
            <small className="home-of">
              {done} of {steps.length}
            </small>
          </h2>
          <ul className="home-steps">
            {steps.map((st) => (
              <li key={st.label}>
                <button onClick={st.go} disabled={st.done} className={st.done ? 'is-done' : undefined}>
                  <span className="home-box" aria-hidden="true" />
                  {st.label}
                  {!st.done && <Chevron dir="right" />}
                </button>
              </li>
            ))}
          </ul>
        </section>
      </main>
    )
  }

  return (
    <main className="home">
      <p className="home-greet">{greeting(name)}</p>

      {painted ? (
        <>
          {life}
          {todayCard}
        </>
      ) : (
        todayCard
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

      <OnThisDay days={days} notes={notes} onDay={onDay} />

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
