import { useEffect, useState } from 'react'
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
 * The life glass: an hourglass whose sand is your life — the top holds the squares left, the bottom
 * the ones spent. Just the icon until tapped; a tap shows "14,620 left · 42%", another hides it.
 * Every half minute a few grains fall, a small nudge that time is moving.
 */
function LifeGlass({ profile }: { profile: Profile }) {
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
  // Sand piles are triangles: area grows with height squared.
  const top = 7.5 * Math.sqrt(left)
  const bottom = 7.5 * Math.sqrt(1 - left)
  return (
    <button
      className={'lifeglass' + (falling ? ' is-falling' : '')}
      onClick={() => setOpen(!open)}
      aria-label={`${fmt(c.left)} squares left, ${c.percentLeft}%`}
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
          {fmt(c.left)} left · {c.percentLeft}%
        </span>
      )}
    </button>
  )
}

// Bottom of every zoom level: the life glass, and the zoom controls (out = expand, in = contract).
export function ZoomBar({ profile, onOut, onIn, onToday }: Props) {
  return (
    <div className="zoombar">
      {profile ? <LifeGlass profile={profile} /> : <span />}
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
