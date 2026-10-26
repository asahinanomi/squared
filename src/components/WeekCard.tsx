import { useRef, useState } from 'react'
import { addDays, fromIso, shortDateParts, todayIso } from '../lib/dates'
import type { Days } from '../lib/days'
import { PAINTS, paintHex, WORD } from '../lib/paints'
import { Chevron } from '../screens/Today'

type Props = {
  days: Days
  /** Birth date, if known: the week never steps back before the week you were born. */
  born?: string
  /** A day of the week, opened to paint or read. */
  onDay: (iso: string) => void
}

// The week, at the top of my days (it was on home, which is gone: today is now, my days looks back).
export function WeekCard({ days, born, onDay }: Props) {
  const today = todayIso()
  // How many weeks back the card shows (0: this week).
  const [back, setBack] = useState(0)
  // The week: paper until painted, so home gains colour as you paint. Each square opens its day. A full week blooms once, a soft wave, like the paint settling. Counted as days in colour, never missed.
  // This week as a calendar has it: Sunday to Saturday. Days still to come are faint outlines; a full week is all
  // seven painted (so its moment comes on Saturday, or when the last blank one is filled in).
  // Swipe the week (or tap ‹ ›) to step back through earlier weeks, to catch up on missed days; never past this week
  // or before the week you were born. It always opens on this week.
  const thisSunday = addDays(today, -fromIso(today).getDay())
  const sunday = addDays(thisSunday, -7 * back)
  const canBack = !born || addDays(sunday, -1) >= born
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
  const open = (d: string) => d <= today && (!born || d >= born)
  const inColour = week.filter((d) => open(d) && days[d]).length
  const full = week.every((d) => days[d])
  // A full week's rainbow, in the colours you painted it.
  const mine = PAINTS.map((p) => ({ p, n: week.filter((d) => days[d]?.color === p.id).length }))
    .filter((x) => x.n)
    .sort((a, b) => b.n - a.n)
  // Outer: the most painted, middle: the next, inner: the least. Two colours: the bigger takes two arcs; one: all three.
  const order = mine.length === 3 ? [0, 1, 2] : mine.length === 2 ? [0, 0, 1] : [0, 0, 0]
  const arcs = order.map((i) => mine[i]?.p.hex)
  return (
    <section className={'home-card home-week' + (full ? ' is-full' : '')} {...swipe}>
      <h2 className="home-head">
        {weekName}
        <small className="home-of">
          {/* Both ways, always in the same place (greyed when there's no further): round, easy to hit. */}
          <button className="home-week-step" aria-label="The week before" disabled={!canBack} onClick={() => step(1)}>
            <Chevron dir="left" />
          </button>
          {/* With its year ("Oct 18 – Oct 24, 2026"); a week across New Year names both ("Dec 28, 2025 – Jan 3, 2026"). */}
          {shortDateParts(week[0]).monthDay}
          {week[0].slice(0, 4) !== week[6].slice(0, 4) && `, ${week[0].slice(0, 4)}`} –{' '}
          {shortDateParts(week[6]).monthDay}, {week[6].slice(0, 4)}
          <button className="home-week-step" aria-label="The week after" disabled={back === 0} onClick={() => step(-1)}>
            <Chevron dir="right" />
          </button>
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
}
