import { useState } from 'react'
import { todayIso } from '../lib/dates'
import { lifeCounts } from '../lib/life'
import type { Profile } from '../lib/profile'

type Props = {
  /** The life the bar shows (no bar until birth date and lifespan are set). */
  profile?: Profile | null
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

const fmt = (n: number) => n.toLocaleString('en-US')

/**
 * The life bar: a battery of the squares left, in ink. Always the same width — the width is the life.
 * "42% left" under it; a tap shows "14,620 squares left", another tap goes back.
 */
function LifeBar({ profile }: { profile: Profile }) {
  const [count, setCount] = useState(false)
  const c = lifeCounts(profile.born, profile.lifespan, todayIso())
  const label = count ? `${fmt(c.left)} squares left` : `${c.percentLeft}% left`
  return (
    <button
      className="lifebar"
      onClick={() => setCount(!count)}
      aria-label={`${fmt(c.left)} squares left, ${c.percentLeft}%`}
    >
      <span className="lifebar-cell" aria-hidden="true">
        <span className="lifebar-fill" style={{ width: `${(c.left / c.total) * 100}%` }} />
      </span>
      <span className="lifebar-label" aria-hidden="true">
        {label}
      </span>
    </button>
  )
}

// Bottom of every zoom level: the life bar, and the zoom controls (out = expand, in = contract).
export function ZoomBar({ profile, onOut, onIn, onToday }: Props) {
  return (
    <div className="zoombar">
      {profile ? <LifeBar profile={profile} /> : <span />}
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
