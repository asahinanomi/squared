import { useEffect, useState } from 'react'
import { todayIso } from '../lib/dates'
import { lifeCounts } from '../lib/life'
import type { Profile } from '../lib/profile'

const fmt = (n: number) => n.toLocaleString('en-US')

export type Unit = 'days' | 'months' | 'years'

/**
 * The life glass: an hourglass whose sand is your life — the top holds the squares left, the bottom
 * the ones spent. Just the icon until tapped; a tap shows "14,620 days to paint!" (in years or months where the squares are), another hides it.
 * Every half minute a few grains fall, a small nudge that time is moving. It sits beside "a life" in the
 * title: information about your life, not a control.
 */
export function LifeGlass({ profile, unit }: { profile: Profile; unit: Unit }) {
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
      aria-label={`${count} to paint`}
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
          {count} to paint!
        </span>
      )}
    </button>
  )
}
