import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { addDays, fromIso, todayIso } from '../lib/dates'
import type { Days } from '../lib/days'
import { lifeCounts } from '../lib/life'
import { frameOf, squareFill } from '../lib/paints'
import type { Profile } from '../lib/profile'

const fmt = (n: number) => n.toLocaleString('en-US')
const md = (iso: string) => fromIso(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
/** "Oct 25 – 31"; across months "Sep 27 – Oct 3". */
const weekRange = (a: string, b: string) =>
  a.slice(0, 7) === b.slice(0, 7) ? `${md(a)} – ${Number(b.slice(8))}` : `${md(a)} – ${md(b)}`
const ahead = (n: number) => (n === 0 ? 'today is the last' : n === 1 ? '1 day ahead' : `${fmt(n)} days ahead`)

// Once per sign-in, a life's bar pours in from the left to where you are and comes to rest; the "now" mark breathes
// out and in (the square's own breath, 2.4s); then the days ahead breathe too, and at the breath's height yesterday's
// count becomes today's: a day has passed (nomi, Oct 31, 2026). Each
// person sees it the first time they open my days after signing in (or opening squared); signing out resets it, so the
// next person does too. Never with "reduce motion".
let poured = false
/** Signed out: the next sign-in pours again. */
export const resetPour = () => void (poured = false)
function pourNow(): boolean {
  if (poured) return false
  poured = true
  return !(typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches)
}

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
    const framed = !!day?.framed && iso <= today
    return {
      className: 'where-cell ' + state + (framed ? ' is-framed' : ''),
      // Framed: its paint's deeper shade (a small square shows a frame as depth, not a ring).
      style:
        day && iso <= today
          ? framed
            ? ({ background: frameOf(day.color), '--frame-fill': frameOf(day.color) } as React.CSSProperties)
            : { background: squareFill(day.color) }
          : undefined,
    }
  }
  const monthName = t.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  const c = profile ? lifeCounts(profile.born, profile.lifespan, today) : null
  const [pour] = useState(() => !!c && pourNow())
  // The pour, to the bar's exact width in pixels (a percentage ended short on iPhone Safari and then snapped forward
  // when the dot began to breathe).
  const lived = useRef<HTMLElement>(null)
  useLayoutEffect(() => {
    const el = lived.current
    if (!pour || !el) return
    const w = el.getBoundingClientRect().width
    el.animate([{ width: '0px' }, { width: `${w}px` }], { duration: 1200, easing: 'cubic-bezier(0.25, 0.1, 0.25, 1)' })
  }, [pour])
  // Yesterday's count first, then one less, once the bar has poured in and the dot has settled.
  const [tick, setTick] = useState(pour)
  useEffect(() => {
    if (!tick) return
    // At the height of the number's breath: after the pour (1.2s), the dot's breath (2.4s), and half of its own.
    const t = setTimeout(() => setTick(false), 4900)
    return () => clearTimeout(t)
  }, [tick])
  return (
    <section className="home-card where-card" aria-label="where you are">
      <div className="where-row">
        <div className="where-head">
          <span>
            this week <em className="where-date">{weekRange(week[0], week[6])}</em>
          </span>
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
          <span>
            this month <em className="where-date">{monthName}</em>
          </span>
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
            <span>this life</span>
            <small className={pour ? 'where-breath' : undefined}>{ahead(tick ? c.left + 1 : c.left)}</small>
          </span>
          <span className={'where-track' + (pour ? ' is-pouring' : '')} aria-hidden="true">
            <i
              ref={lived}
              className="where-lived"
              style={{ '--lived': `${(c.sofar / c.total) * 100}%` } as React.CSSProperties}
            />
            <i className="where-now" />
            <i className="where-ahead" />
          </span>
        </button>
      ) : (
        <button className="where-row" onClick={onSetUp}>
          <span className="where-head">
            <span>this life</span>
            <small className="is-setup">set up now ›</small>
          </span>
          <span className="where-track is-ghost" aria-hidden="true">
            <i className="where-lived" />
            <i className="where-now" />
            <i className="where-ahead" />
          </span>
        </button>
      )}
    </section>
  )
}
