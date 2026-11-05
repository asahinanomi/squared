import { LifeHead, type Resolution } from '../components/LifeHead'
import { ZoomBar } from '../components/ZoomBar'
import { todayIso } from '../lib/dates'
import type { Days } from '../lib/days'
import type { Profile } from '../lib/profile'
import { bands } from '../lib/tally'
import { calmMotion, FILL_MS, LAND_MS, sayHere, waveAt } from '../lib/lifeFill'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'

type Props = {
  days: Days
  profile: Profile
  /** Open a year's months. */
  onPick: (year: number) => void
  /** Zoom in: this month. */
  onIn: () => void
  /** Switch to months or days. */
  onResolution: (r: Resolution) => void
  /** Zoom out: a life in months. */
  onOut?: () => void
}

// A life, in years — every year of it on one screen, on purpose: the whole life at a glance.
// Lived years are banded, this year is outlined, the years ahead are empty.
// The years' fill, ms: slower than the months' (a year is a big tile; fast, they flickered).
const YEARS_FILL = FILL_MS * 1.25 // a little longer than days: the fewest squares, each landing a shade darker, read fast

export function Life({ days, profile, onPick, onIn, onResolution, onOut }: Props) {
  const today = todayIso()
  const { born, lifespan } = profile
  const first = Number(born.slice(0, 4))
  const thisYear = Number(today.slice(0, 4))
  const years = Array.from({ length: lifespan }, (_, i) => first + i)
  // The fill (lib/lifeFill.ts): the lived years land one after another, calmly (nomi, Nov 5, 2026: a second was
  // too fast here, each year a big tile), easing into this year, which then pulses; then "You are here." under it,
  // until you move. Any touch or scroll ends the fill.
  const [filling, setFilling] = useState(() => !calmMotion())
  const lived = Math.max(1, thisYear - first + 1)
  const landAt = (i: number) => {
    const q = Math.min(1, i / lived)
    return Math.round(waveAt(q) * YEARS_FILL)
  }
  const [here, setHere] = useState(false)
  useEffect(() => {
    const t = setTimeout(
      () => {
        setHere(true)
        sayHere()
      },
      calmMotion() ? 0 : YEARS_FILL + 400,
    )
    return () => clearTimeout(t)
  }, [])
  // Where this year's tile is, for the line under it.
  const grid = useRef<HTMLDivElement>(null)
  const [at, setAt] = useState<{ top: number; left: number } | null>(null)
  useLayoutEffect(() => {
    if (!here) return
    const g = grid.current
    const tile = g?.querySelector<HTMLElement>('.life-year.is-current')
    if (!g || !tile) return
    const left = tile.offsetLeft + tile.offsetWidth / 2
    setAt({ top: tile.offsetTop + tile.offsetHeight + 14, left: Math.min(Math.max(left, 110), g.clientWidth - 110) })
  }, [here])
  const moved = () => {
    setFilling(false)
    setHere(false)
  }

  return (
    <main className="life">
      <LifeHead profile={profile} current="years" onPick={onResolution} />

      <div
        className={'life-years' + (filling ? ' is-filling' : '')}
        style={
          {
            gridTemplateColumns: `repeat(${lifespan > 100 ? 10 : 8}, 1fr)`,
            '--land': `${LAND_MS}ms`,
            '--pulse-at': `${YEARS_FILL}ms`,
          } as React.CSSProperties
        }
        ref={grid}
        onPointerDown={moved}
        onWheel={moved}
        onScroll={() => here && setHere(false)}
      >
        {years.map((y) => {
          if (y > thisYear)
            return (
              <span key={y} className="life-year is-ahead">
                {y}
              </span>
            )
          const bs = bands(days, `${y}-01-01`, `${y}-12-31`, today, born)
          return (
            <button
              key={y}
              className={'life-year' + (y === thisYear ? ' is-current' : '') + (bs.length ? '' : ' is-blank')}
              style={{ '--land-at': `${landAt(y - first)}ms` } as React.CSSProperties}
              data-year={y}
              aria-label={String(y)}
              onClick={() => onPick(y)}
            >
              <span className="bands" aria-hidden="true">
                {bs.map((b, i) => (
                  <span key={i} style={{ background: b.fill, flexGrow: b.share }} />
                ))}
                <span style={{ flexGrow: 1 - bs.reduce((s, b) => s + b.share, 0) }} />
              </span>
              <span className="life-year-name">{y}</span>
            </button>
          )
        })}
        {here && at && (
          <p className="life-this-is-today" style={{ top: at.top, left: at.left }}>
            You are here.
          </p>
        )}
      </div>

      <ZoomBar onIn={onIn} onOut={onOut} />
    </main>
  )
}
