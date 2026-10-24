import { useRef, useState } from 'react'
import { addDays, fromIso, shortDateParts, todayIso } from '../lib/dates'
import type { Days } from '../lib/days'
import { lifeCounts } from '../lib/life'
import type { Notes } from '../lib/notes'
import { PAINTS, paintDeep, paintHex, WORD } from '../lib/paints'
import type { Profile } from '../lib/profile'
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
  onDay: (iso: string) => void
  /** paint another day: the day finder, straight away. */
  onFind: () => void
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
// Home is today, now: today first ("Today is in colour.", or the question and "paint today"), the week in colour,
// and "paint another day". Looking back (a life, the paintings so far, framed days) lives in my days. No streaks,
// no scores. Lab: https://claude.ai/artifact/EJ5eciFVqMwawnNmeDbezr (L, M, N)
// Before the first square (squares set, nothing painted): only your days ahead, the question with "paint your
// first square", and getting started, so there's one thing to do. Lab: https://claude.ai/artifact/EJ5eciFVqMwawnNmeDbezr (K)
export function Home({ name, days, notes, profile, steps, onToday, onDay, onFind }: Props) {
  const today = todayIso()
  const painted = days[today]
  // How many weeks back the week card shows (0: this week).
  const [back, setBack] = useState(0)
  // Before the first square: squares set, nothing painted (wiping the only square brings it back).
  const first = !!profile && Object.keys(days).length === 0

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
      <p className="home-q">
        did I spend <u>Today</u> meaningfully?
      </p>
      <button className="pill" onClick={onToday}>
        paint today
      </button>
      {/* A day in the past: straight to the day finder (year, month, day), not through today. */}
      <button className="pill is-keyline" onClick={onFind}>
        paint another day
      </button>
    </div>
  )

  // The week: paper until painted, so home gains colour as you paint. Each square opens its day. A full week blooms once, a soft wave, like the paint settling. Counted as days in colour, never missed.
  // This week as a calendar has it: Sunday to Saturday. Days still to come are faint outlines; a full week is all
  // seven painted (so its moment comes on Saturday, or when the last blank one is filled in).
  // Swipe the week (or tap ‹ ›) to step back through earlier weeks, to catch up on missed days; never past this week
  // or before the week you were born. Home always opens on this week.
  const thisSunday = addDays(today, -fromIso(today).getDay())
  const sunday = addDays(thisSunday, -7 * back)
  const canBack = !profile || addDays(sunday, -1) >= profile.born
  const step = (n: number) => setBack((b) => Math.max(0, b + n))
  const touch = useRef<{ x: number; y: number } | null>(null)
  const swipe = {
    onTouchStart: (e: React.TouchEvent) => (touch.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }),
    onTouchEnd: (e: React.TouchEvent) => {
      const t = touch.current
      touch.current = null
      if (!t) return
      const dx = e.changedTouches[0].clientX - t.x
      const dy = e.changedTouches[0].clientY - t.y
      if (Math.abs(dx) < 50 || Math.abs(dx) < Math.abs(dy) * 1.5) return
      if (dx > 0 && canBack)
        step(1) // swiped right: the week before
      else if (dx < 0 && back > 0) step(-1)
    },
  }
  const weekName = back === 0 ? 'this week' : back === 1 ? 'last week' : `${back} weeks ago`
  const that = back === 0 ? 'this week' : 'that week'
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
    <section className={'home-card home-week' + (full ? ' is-full' : '')} {...swipe}>
      <h2 className="home-head">
        {weekName}
        <small className="home-of">
          {canBack && (
            <button className="home-week-step" aria-label="The week before" onClick={() => step(1)}>
              <Chevron dir="left" />
            </button>
          )}
          {/* With its year ("Oct 18 – Oct 24, 2026"); a week across New Year names both ("Dec 28, 2025 – Jan 3, 2026"). */}
          {shortDateParts(week[0]).monthDay}
          {week[0].slice(0, 4) !== week[6].slice(0, 4) && `, ${week[0].slice(0, 4)}`} –{' '}
          {shortDateParts(week[6]).monthDay}, {week[6].slice(0, 4)}
          {back > 0 && (
            <button className="home-week-step" aria-label="The week after" onClick={() => step(-1)}>
              <Chevron dir="right" />
            </button>
          )}
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
          <b>Every day {that}, in colour.</b>
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
          {that}.
        </p>
      ) : (
        <p className="home-week-line">{back ? 'Nothing painted that week.' : 'Nothing painted this week yet.'}</p>
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
      {/* Home asks you to paint: today, then the week, where a day not painted yet opens with a tap. */}
      {weekCard}
      {painted && (
        <button className="pill home-another" onClick={onFind}>
          paint another day
        </button>
      )}
    </main>
  )
}
