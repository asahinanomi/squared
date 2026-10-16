import { LifeHead, type Resolution } from '../components/LifeHead'
import { ZoomBar } from '../components/ZoomBar'
import { todayIso } from '../lib/dates'
import type { Days } from '../lib/days'
import type { Profile } from '../lib/profile'
import { bands } from '../lib/tally'

type Props = {
  days: Days
  profile: Profile
  /** Open a year's months. */
  onPick: (year: number) => void
  /** Zoom in: this year. */
  onIn: () => void
  /** Switch to months or days. */
  onResolution: (r: Resolution) => void
}

// A life, in years — every year of it on one screen, on purpose: the whole life at a glance.
// Lived years are banded, this year is outlined, the years ahead are empty.
export function Life({ days, profile, onPick, onIn, onResolution }: Props) {
  const today = todayIso()
  const { born, lifespan } = profile
  const first = Number(born.slice(0, 4))
  const thisYear = Number(today.slice(0, 4))
  const years = Array.from({ length: lifespan }, (_, i) => first + i)

  return (
    <main className="life">
      <LifeHead profile={profile} current="years" onPick={onResolution} ready={['years', 'months']} />

      <div className="life-years" style={{ gridTemplateColumns: `repeat(${lifespan > 100 ? 10 : 8}, 1fr)` }}>
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
      </div>

      <ZoomBar hint="this year is outlined · tap a year to open it" onIn={onIn} />
    </main>
  )
}
