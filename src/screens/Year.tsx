import { ZoomBar } from '../components/ZoomBar'
import { isoDate, todayIso } from '../lib/dates'
import type { Days } from '../lib/days'
import type { Profile } from '../lib/profile'
import { useBackToToday } from '../lib/backToToday'
import { bands, monthEnd } from '../lib/tally'
import { useLadderScroll } from '../lib/useLadderScroll'
import { Chevron } from './Today'

type Props = {
  days: Days
  /** For the life bar at the bottom. */
  profile?: Profile | null
  born?: string
  /** Year to open on (zooming in from a life); otherwise this year. */
  focus?: number
  /** Open a month's days. */
  onPick: (monthIso: string) => void
  /** Zoom in: this month's days. */
  onIn: () => void
  /** Zoom out to a life (absent until that level exists). */
  onOut?: () => void
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

// A year — twelve banded month-squares (6×2). Your years stack in one scroll, from the birth
// year down to this one (next year peeks in faintly below). Opens centred on this year.
export function Year({ days, profile, born, focus, onPick, onIn, onOut }: Props) {
  const today = todayIso()
  const thisYear = Number(today.slice(0, 4))
  const thisMonth = today.slice(0, 7)
  const maxBack = born ? thisYear - Number(born.slice(0, 4)) : Infinity
  const { scroller, back, visible, onScroll, jumpTo } = useLadderScroll({
    maxBack,
    batch: 5,
    focus: String(focus ?? thisYear),
    focusBack: thisYear - (focus ?? thisYear),
  })
  const toToday = useBackToToday(scroller, '.year-month.is-current')
  const years = Array.from({ length: back + 1 }, (_, i) => thisYear - back + i)
  const shown = Number(visible)

  const square = (year: number, m: number) => {
    const first = isoDate(new Date(year, m, 1))
    const key = first.slice(0, 7)
    const ahead = key > thisMonth
    const beforeBirth = !!born && monthEnd(first) < born
    if (ahead || beforeBirth)
      return (
        <span key={m} className={'year-month ' + (ahead ? 'is-ahead' : 'is-before')}>
          {MONTHS[m]}
        </span>
      )
    const bs = bands(days, first, monthEnd(first), today, born)
    return (
      <button
        key={m}
        className={'year-month' + (key === thisMonth ? ' is-current' : '') + (bs.length ? '' : ' is-blank')}
        aria-label={`${MONTHS[m]} ${year}`}
        onClick={() => onPick(first)}
      >
        <span className="bands" aria-hidden="true">
          {bs.map((b, i) => (
            <span key={i} style={{ background: b.fill, flexGrow: b.share }} />
          ))}
          <span style={{ flexGrow: 1 - bs.reduce((s, b) => s + b.share, 0) }} />
        </span>
        <span className="year-month-name">{MONTHS[m]}</span>
      </button>
    )
  }

  return (
    <main className="year">
      <div className="ladder-head">
        <button
          aria-label="Previous year"
          disabled={thisYear - shown >= maxBack}
          onClick={() => jumpTo(String(shown - 1), thisYear - shown + 1)}
        >
          <Chevron dir="left" />
        </button>
        <h1 className="ladder-title">{visible}</h1>
        <button
          aria-label="Next year"
          disabled={shown >= thisYear}
          onClick={() => jumpTo(String(shown + 1), thisYear - shown - 1)}
        >
          <Chevron dir="right" />
        </button>
      </div>

      <div
        className="ladder-scroll"
        ref={scroller}
        onScroll={() => {
          onScroll()
          toToday.check()
        }}
      >
        {years.map((y) => (
          <section key={y} className="year-block" data-key={String(y)}>
            <div className="ladder-label">{y}</div>
            <div className="year-grid">{MONTHS.map((_, m) => square(y, m))}</div>
          </section>
        ))}
        {/* Next year peeks in, faint. */}
        <section className="year-block is-faint" aria-hidden="true">
          <div className="ladder-label">{thisYear + 1}</div>
          <div className="year-grid">
            {MONTHS.map((name) => (
              <span key={name} className="year-month is-ahead">
                {name}
              </span>
            ))}
          </div>
        </section>
      </div>

      <ZoomBar
        profile={profile}
        unit="months"
        onIn={onIn}
        onOut={onOut}
        onToday={toToday.away ? toToday.back : undefined}
      />
    </main>
  )
}
