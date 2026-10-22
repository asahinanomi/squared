import { PaintingThumb } from '../components/PaintingThumb'
import { addDays, fromIso, shortDateParts, todayIso } from '../lib/dates'
import type { Days } from '../lib/days'
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
export function Home({ name, days, notes, profile, steps, onToday, onLife, onDay, onPainting }: Props) {
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
      return (
        <button className="home-card home-life" onClick={onLife} aria-label={`a life: ${fmt(c.left)} days ahead`}>
          <span className="home-head">
            a life
            <Chevron dir="right" />
          </span>
          {/* Time runs left to right: the past in ink, so the days ahead (the number) sit on the right. */}
          <span className="home-big is-ahead">
            {fmt(c.left)}
            <small>days</small>
          </span>
          <span className="home-bar" aria-hidden="true">
            <i style={{ width: `${(c.sofar / c.total) * 100}%` }} />
          </span>
          <span className="home-legend">
            <span>{lived}% lived</span>
            <span>{100 - lived}% ahead</span>
          </span>
        </button>
      )
    })()

  // Today, painted: its square and date, and its note (the pinned one, what you want to remember, else the latest).
  const todayNotes = notes[today] ?? []
  const todayNote = todayNotes.find((n) => n.pinned) ?? todayNotes[todayNotes.length - 1]
  const todayCard = painted ? (
    <button className="home-card home-today" onClick={onToday} aria-label="Open today">
      <span className="home-sq" style={{ background: paintHex(painted.color) }} aria-hidden="true">
        <span style={{ color: paintDeep(painted.color) }}>{WORD[painted.color]}</span>
      </span>
      <span>
        <span className="home-t">
          <DateLine iso={today} />
        </span>
        {todayNote && <span className="home-note">“{todayNote.body}”</span>}
      </span>
      {/* The same quiet cue as the other cards: this opens. */}
      <Chevron dir="right" />
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

  // The week: paper until painted, so home gains colour as you paint. Each square opens its day. A full week blooms once, a soft wave, like the paint settling. Counted as days in colour, never missed.
  // This week as a calendar has it: Sunday to Saturday. Days still to come are faint outlines; a full week is all
  // seven painted (so its moment comes on Saturday, or when the last blank one is filled in).
  const sunday = addDays(today, -fromIso(today).getDay())
  const week = Array.from({ length: 7 }, (_, i) => addDays(sunday, i))
  const open = (d: string) => d <= today && (!profile || d >= profile.born)
  const inColour = week.filter((d) => open(d) && days[d]).length
  const full = week.every((d) => days[d])
  // A full week's rainbow, in the colours you painted it.
  const mine = PAINTS.map((p) => ({ p, n: week.filter((d) => days[d]?.color === p.id).length }))
    .filter((x) => x.n)
    .sort((a, b) => b.n - a.n)
  // Outer: the most painted, middle: the next, inner: the least. Two colours: the bigger takes two arcs; one: all three.
  const order = mine.length === 3 ? [0, 1, 2] : mine.length === 2 ? [0, 0, 1] : [0, 0, 0]
  const arcs = order.map((i) => mine[i]?.p.hex)
  const weekCard = (
    <section className={'home-card home-week' + (full ? ' is-full' : '')}>
      <h2 className="home-head">
        this week
        <small className="home-of">
          {shortDateParts(week[0]).monthDay} – {shortDateParts(week[6]).monthDay}
        </small>
      </h2>
      <ul className="home-week-days">
        {week.map((d, i) => (
          <li key={d}>
            <button
              onClick={() => onDay(d)}
              disabled={!open(d)}
              aria-label={`${fromIso(d).toLocaleDateString('en-US', { weekday: 'long' })}: ${days[d] ? WORD[days[d].color] : open(d) ? 'not painted yet' : 'still to come'}`}
            >
              <i
                className={(days[d] ? '' : open(d) ? 'is-paper' : 'is-ahead') + (d === today ? ' is-today' : '')}
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
          {/* Somewhere over the rainbow: a small rainbow in your week's colours draws itself once, for a full week. */}
          <svg className="home-rainbow" viewBox="0 0 24 14" aria-hidden="true">
            <path pathLength="1" d="M2 13a10 10 0 0 1 20 0" style={{ stroke: arcs[0] }} />
            <path pathLength="1" d="M5.5 13a6.5 6.5 0 0 1 13 0" style={{ stroke: arcs[1] }} />
            <path pathLength="1" d="M9 13a3 3 0 0 1 6 0" style={{ stroke: arcs[2] }} />
          </svg>
          <small>You showed up for every single one.</small>
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
          <p className="home-hero-c">days ahead of you.</p>
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
      {/* Today painted: the same date looked back on comes next, then the wider week. Not yet: the week stays
          under the question, part of the invitation to paint. */}
      {!painted && weekCard}

      <OnThisDay days={days} notes={notes} onDay={onDay} />

      {painted && weekCard}

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
