import { PaintingThumb } from '../components/PaintingThumb'
import { addDays, fromIso, shortDateParts, todayIso } from '../lib/dates'
import { stampLine, type Days } from '../lib/days'
import { daysBetween, lifeCounts } from '../lib/life'
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
// Today first ("Today is in colour.", or the question and "paint today"), then the week in colour, a month and a
// year ago today, your life in one line, and this month and year so far, as paintings. Every card is a door. No
// streaks, no scores. Lab: https://claude.ai/artifact/EJ5eciFVqMwawnNmeDbezr (L, M, N)
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
      // The Oz bar: lived before squared in ink (never painted), the days since your first square in colour, in
      // true proportion (paper for the ones skipped), and the days ahead in paper.
      const first = Object.keys(days)
        .filter((d) => d <= today)
        .sort()[0]
      const since = first ? Math.min(daysBetween(first, today) + 1, c.sofar) : 0
      const counted = Object.entries(days).filter(([d]) => first && d >= first && d <= today)
      const by = PAINTS.map((p) => ({ p, n: counted.filter(([, d]) => d.color === p.id).length }))
      const skipped = Math.max(since - by.reduce((n, b) => n + b.n, 0), 0)
      const w = (n: number) => `${(n / c.total) * 100}%`
      return (
        <button className="home-card home-life" onClick={onLife} aria-label={`a life: ${fmt(c.left)} days ahead`}>
          <span className="home-head">
            a life
            <Chevron dir="right" />
          </span>
          {/* Time runs left to right: the past in ink, so the days ahead (the number) sit on the right. */}
          <span className="home-big is-ahead">
            {fmt(c.left)}
            <small>days ahead</small>
          </span>
          <span className="home-bar" aria-hidden="true">
            <i style={{ width: w(c.sofar - since) }} />
            {by.map(({ p, n }) => (
              <i key={p.id} style={{ width: w(n), background: p.hex }} />
            ))}
            <i className="is-skipped" style={{ width: w(skipped) }} />
          </span>
          <span className="home-legend">
            <span>{lived}% lived</span>
            <span>{100 - lived}% ahead</span>
          </span>
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
      <p className="home-blank">today is still paper</p>
      <p className="home-q">
        did I spend <u>Today</u> meaningfully?
      </p>
      <button className="pill" onClick={onToday}>
        paint today
      </button>
    </div>
  )

  // The last seven days, today last: paper until painted, so home gains colour as you paint. Each square opens its
  // day. A full week blooms once, a soft wave, like the paint settling. Counted as days in colour, never missed.
  const week = Array.from({ length: 7 }, (_, i) => addDays(today, i - 6)).filter((d) => !profile || d >= profile.born)
  const inColour = week.filter((d) => days[d]).length
  const full = inColour === week.length
  const missing = week.find((d) => !days[d] && d !== today)
  const weekCard = (
    <section className={'home-card home-week' + (full ? ' is-full' : '')}>
      <h2 className="home-head">
        this week
        <small className="home-of">
          {shortDateParts(week[0]).monthDay} – {shortDateParts(today).monthDay}
        </small>
      </h2>
      <ul className="home-week-days">
        {week.map((d, i) => (
          <li key={d}>
            <button
              onClick={() => onDay(d)}
              aria-label={`${fromIso(d).toLocaleDateString('en-US', { weekday: 'long' })}: ${days[d] ? WORD[days[d].color] : 'not painted yet'}`}
            >
              <i
                className={(days[d] ? '' : 'is-paper') + (d === today ? ' is-today' : '')}
                style={{ ...(days[d] ? { background: paintHex(days[d].color) } : {}), '--i': i } as React.CSSProperties}
              />
              {d === today ? <b>today</b> : fromIso(d).toLocaleDateString('en-US', { weekday: 'narrow' })}
            </button>
          </li>
        ))}
      </ul>
      {full ? (
        <p className="home-week-line">
          <b>Every day this week, in colour.</b>
          <small>{week.length} days you noticed</small>
        </p>
      ) : inColour ? (
        <p className="home-week-line">
          <b>
            {inColour} {inColour === 1 ? 'day' : 'days'} in colour
          </b>{' '}
          this week.
        </p>
      ) : (
        <p className="home-week-line">This week is still paper.</p>
      )}
      {/* A quiet second way in: the oldest day this week still paper (today has its own pill). */}
      {missing && (
        <button className="home-yesterday home-week-go" onClick={() => onDay(missing)}>
          {missing === addDays(today, -1)
            ? 'paint yesterday'
            : `paint ${fromIso(missing).toLocaleDateString('en-US', { weekday: 'long' })}`}
        </button>
      )}
    </section>
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
      {painted ? (
        <>
          <p className="home-greet is-left">{greeting(name)}</p>
          <h1 className="home-title">Today is in colour.</h1>
        </>
      ) : (
        <p className="home-greet">{greeting(name)}</p>
      )}

      {todayCard}
      {weekCard}

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

      {life}

      {(hasMonth || hasYear) && (
        <section className="home-card home-paintings">
          {hasMonth && (
            <button onClick={() => onPainting(month)}>
              <span className="home-t">{new Date().toLocaleDateString('en-US', { month: 'long' })}, so far</span>
              <PaintingThumb month={month} days={days} />
              <span className="home-s">{count(month)} days in colour</span>
            </button>
          )}
          {hasYear && (
            <button onClick={() => onPainting(year)}>
              <span className="home-t">{year}, so far</span>
              <PaintingThumb month={year} days={days} />
              <span className="home-s">{count(year)} days in colour</span>
            </button>
          )}
        </section>
      )}
    </main>
  )
}
