import { PaintingThumb } from '../components/PaintingThumb'
import { todayIso } from '../lib/dates'
import type { Days } from '../lib/days'
import { lifeCounts } from '../lib/life'
import type { Profile } from '../lib/profile'
import { Chevron } from './Today'

const fmt = (n: number) => n.toLocaleString('en-US')

type Props = {
  days: Days
  profile: Profile | null
  onPainting: (period: string) => void
  /** The bar: time runs left to right, so it opens the list of days, on today. */
  onList: () => void
  onPie: () => void
  onSquares: () => void
  onMatters: () => void
  onFramed: () => void
  onPaintings: () => void
  /** Beside the title: back to today, now. */
  onToday: () => void
}

// my days (the menu): looking back, every door into your past in one place, never a dashboard of numbers. A life as one
// bar (days lived, days ahead; it opens the list), this month and year so far as paintings, then what matters, a life
// in squares, in slices, the days you framed and the paintings you kept. Home stays today, now. Each row is named
// after the page it opens; the page is "my days", so no row says "my".
export function MyDays({
  days,
  profile,
  onPainting,
  onList,
  onPie,
  onSquares,
  onMatters,
  onFramed,
  onPaintings,
  onToday,
}: Props) {
  const today = todayIso()
  const month = today.slice(0, 7)
  const year = today.slice(0, 4)
  const count = (p: string) => Object.keys(days).filter((d) => d.startsWith(p) && d <= today).length
  const hasMonth = count(month) > 0
  const hasYear = count(year) > 0
  const row = (label: string, sub: string, go: () => void) => (
    <button className="settings-row" onClick={go}>
      <span>
        <span className="settings-label">{label}</span>
        <span className="settings-sub">{sub}</span>
      </span>
      <Chevron dir="right" />
    </button>
  )
  return (
    <main className="settings my-days">
      {/* Looking back, with the way to now always at hand, on the title's far right. */}
      <div className="my-days-head">
        <h1 className="settings-title">my days</h1>
        <button className="my-days-today" onClick={onToday}>
          today
          <Chevron dir="right" />
        </button>
      </div>
      {profile &&
        (() => {
          const c = lifeCounts(profile.born, profile.lifespan, today)
          const lived = Math.round((c.sofar / c.total) * 100)
          return (
            <button
              className="home-card home-life my-days-life"
              onClick={onList}
              aria-label={`a life: ${fmt(c.left)} days ahead`}
            >
              <span className="home-head">
                a life
                <Chevron dir="right" />
              </span>
              {/* Time runs left to right: the past in ink, so the days ahead (the number) sit on the right. */}
              <span className="home-big is-ahead">
                {fmt(c.left)}
                <small>days</small>
              </span>
              {/* Now, on the line: a dot where the days lived meet the days ahead, "today" under it. */}
              <span className="life-track" aria-hidden="true">
                <span className="home-bar">
                  <i style={{ width: `${(c.sofar / c.total) * 100}%` }} />
                </span>
                <i className="life-now" style={{ left: `${(c.sofar / c.total) * 100}%` }} />
              </span>
              <span className="life-now-label" aria-hidden="true">
                <span style={{ left: `clamp(18px, ${(c.sofar / c.total) * 100}%, calc(100% - 18px))` }}>today</span>
              </span>
              <span className="home-legend">
                <span>{lived}% lived</span>
                <span>{100 - lived}% ahead</span>
              </span>
              {/* squared's line, the bar's caption: what its "today" means. The tagline candidate (brand story). */}
              <span className="my-days-line">The past is painted. Today is still yours.</span>
            </button>
          )
        })()}
      {(hasMonth || hasYear) && (
        <section className="home-card home-paintings my-days-paintings">
          {hasMonth && (
            <button onClick={() => onPainting(month)}>
              <span className="home-t">{new Date().toLocaleDateString('en-US', { month: 'long' })}, so far</span>
              <PaintingThumb month={month} days={days} />
              <span className="home-s">{count(month)} days in colour</span>
            </button>
          )}
          {hasYear && (
            <button onClick={() => onPainting(year)}>
              <span className="home-t">{year}, so far</span>
              <PaintingThumb month={year} days={days} />
              <span className="home-s">{count(year)} days in colour</span>
            </button>
          )}
        </section>
      )}
      <div className="settings-rows is-last">
        {row('what matters', 'your compass', onMatters)}
        {row('a life, in squares', 'every day, as a square', onSquares)}
        {profile && row('a life, in slices', 'your days, as a pie', onPie)}
        {row('framed days', 'the days you framed', onFramed)}
        {row('paintings', 'the paintings you kept', onPaintings)}
      </div>
    </main>
  )
}
