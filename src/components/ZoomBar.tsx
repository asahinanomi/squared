import { createContext, useContext, useEffect, useState } from 'react'
import { todayIso } from '../lib/dates'
import { lifeCounts } from '../lib/life'
import type { Profile } from '../lib/profile'

type Props = {
  /** The life the bar shows (no bar until birth date and lifespan are set). */
  profile?: Profile | null
  /** What the squares on this screen are, so the count speaks the same unit (days by default). */
  unit?: Unit
  /** Zoom out one level (see more); absent when there's no level further out yet. */
  onOut?: () => void
  /** Zoom in one level (see less, closer). */
  onIn?: () => void
  /** Back to today, on this same screen — shown only once today has scrolled out of view. */
  onToday?: () => void
}

const stroke = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
} as const

/** Arrows pointing out: see more. */
export const ZoomOutIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" {...stroke}>
    <polyline points="3.5 8 3.5 3.5 8 3.5" />
    <line x1="3.5" y1="3.5" x2="10" y2="10" />
    <polyline points="16 3.5 20.5 3.5 20.5 8" />
    <line x1="20.5" y1="3.5" x2="14" y2="10" />
    <polyline points="20.5 16 20.5 20.5 16 20.5" />
    <line x1="20.5" y1="20.5" x2="14" y2="14" />
    <polyline points="8 20.5 3.5 20.5 3.5 16" />
    <line x1="3.5" y1="20.5" x2="10" y2="14" />
  </svg>
)

/** Arrows pointing in: come closer. */
export const ZoomInIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" {...stroke}>
    <polyline points="4.5 9 9 9 9 4.5" />
    <line x1="9" y1="9" x2="3.5" y2="3.5" />
    <polyline points="15 4.5 15 9 19.5 9" />
    <line x1="15" y1="9" x2="20.5" y2="3.5" />
    <polyline points="19.5 15 15 15 15 19.5" />
    <line x1="15" y1="15" x2="20.5" y2="20.5" />
    <polyline points="9 19.5 9 15 4.5 15" />
    <line x1="9" y1="15" x2="3.5" y2="20.5" />
  </svg>
)

/** A pie: the whole life in slices. Drawn to the zoom icons' height. */
export const PieIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" {...stroke}>
    <circle cx="12" cy="12" r="8.5" />
    <line x1="12" y1="12" x2="12" y2="3.5" />
    <line x1="12" y1="12" x2="19.4" y2="16.25" />
  </svg>
)

/** Squares, one painted: back to the zoom levels. Drawn to the zoom icons' height. */
export const SquaresIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" {...stroke}>
    <rect x="3.5" y="3.5" width="6" height="6" rx="1.2" />
    <rect x="14.5" y="3.5" width="6" height="6" rx="1.2" fill="currentColor" />
    <rect x="3.5" y="14.5" width="6" height="6" rx="1.2" />
    <rect x="14.5" y="14.5" width="6" height="6" rx="1.2" />
  </svg>
)

/** The switch between the squares and the pie, centre of the bar: `pie` = the pie is showing. */
export const ViewSwitch = createContext<{ pie: boolean; toggle: () => void } | null>(null)

const fmt = (n: number) => n.toLocaleString('en-US')

type Unit = 'days' | 'months' | 'years'

/**
 * The life glass: an hourglass whose sand is your life — the top holds the squares left, the bottom
 * the ones spent. Just the icon until tapped; a tap shows "14,620 days (42%) to paint!" (in years or months where the squares are), another hides it.
 * Every half minute a few grains fall, a small nudge that time is moving.
 */
function LifeGlass({ profile, unit }: { profile: Profile; unit: Unit }) {
  const [open, setOpen] = useState(false)
  const [falling, setFalling] = useState(true) // trickle once on arrival…
  useEffect(() => {
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return setFalling(false)
    const off = setTimeout(() => setFalling(false), 1800)
    const every = setInterval(() => {
      setFalling(true) // …then again every 30 seconds
      setTimeout(() => setFalling(false), 1800)
    }, 30_000)
    return () => {
      clearTimeout(off)
      clearInterval(every)
    }
  }, [])
  const c = lifeCounts(profile.born, profile.lifespan, todayIso())
  const left = c.left / c.total
  // In years or months, counted from the squares so spent + to paint always add up to the life.
  const per = unit === 'years' ? profile.lifespan : unit === 'months' ? profile.lifespan * 12 : 0
  const count = per ? `${fmt(per - Math.round((c.sofar / c.total) * per))} ${unit}` : `${fmt(c.left)} days`
  // Sand piles are triangles: area grows with height squared.
  const top = 7.5 * Math.sqrt(left)
  const bottom = 7.5 * Math.sqrt(1 - left)
  return (
    <button
      className={'lifeglass' + (falling ? ' is-falling' : '')}
      onClick={() => setOpen(!open)}
      aria-label={`${count} (${c.percentLeft}%) to paint`}
      aria-expanded={open}
    >
      <svg viewBox="0 0 24 28" aria-hidden="true">
        <path d="M5 3 H19 M5 25 H19" className="lifeglass-frame" />
        <path
          d="M7 3.5 C7 9 11 11.5 11.4 14 C11 16.5 7 19 7 24.5 M17 3.5 C17 9 13 11.5 12.6 14 C13 16.5 17 19 17 24.5"
          className="lifeglass-glass"
        />
        <path d={`M${12 - top * 0.55} ${13.2 - top} H${12 + top * 0.55} L12 13.2 Z`} className="lifeglass-sand" />
        <path
          d={`M${12 - bottom * 0.62} 23.6 H${12 + bottom * 0.62} L12 ${23.6 - bottom} Z`}
          className="lifeglass-sand"
        />
        <circle cx="12" cy="15" r="0.9" className="lifeglass-grain" />
        <circle cx="12" cy="15" r="0.9" className="lifeglass-grain" />
        <circle cx="12" cy="15" r="0.9" className="lifeglass-grain" />
      </svg>
      {open && (
        <span className="lifeglass-count" aria-hidden="true">
          {count} ({c.percentLeft}%) to paint!
        </span>
      )}
    </button>
  )
}

// Bottom of every zoom level: the life glass, the pie ↔ squares switch, and the zoom controls (out = expand, in = contract).
export function ZoomBar({ profile, unit = 'days', onOut, onIn, onToday }: Props) {
  const view = useContext(ViewSwitch)
  return (
    <div className="zoombar">
      {profile ? <LifeGlass profile={profile} unit={unit} /> : <span />}
      {view && (
        <button className="zoombar-view" aria-label={view.pie ? 'Squares' : 'Pie view'} onClick={view.toggle}>
          {view.pie ? <SquaresIcon /> : <PieIcon />}
        </button>
      )}
      <div className="zoombar-buttons">
        {onToday && (
          <button className="zoombar-today" onClick={onToday}>
            today
          </button>
        )}
        <button aria-label="Zoom out" disabled={!onOut} onClick={onOut}>
          <ZoomOutIcon />
        </button>
        <button aria-label="Zoom in" disabled={!onIn} onClick={onIn}>
          <ZoomInIcon />
        </button>
      </div>
    </div>
  )
}
