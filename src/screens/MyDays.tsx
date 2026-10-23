import { PaintingThumb } from '../components/PaintingThumb'
import { todayIso } from '../lib/dates'
import type { Days } from '../lib/days'
import type { Profile } from '../lib/profile'
import { Chevron } from './Today'

type Props = {
  days: Days
  profile: Profile | null
  onPainting: (period: string) => void
  onPie: () => void
  onSquares: () => void
  onMatters: () => void
  onFramed: () => void
  onPaintings: () => void
}

// my days (the menu): looking back, every door into your past in one place, never a dashboard of numbers. This month
// and year so far, as paintings; then a life pie, a life, what matters, the days you framed and the paintings you
// kept. Home stays today, now. (The pie as a picture here read techy and alone; a row until there's a better idea.)
export function MyDays({ days, profile, onPainting, onPie, onSquares, onMatters, onFramed, onPaintings }: Props) {
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
      <h1 className="settings-title">my days</h1>
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
        {profile && row('a life pie', 'your days, in slices', onPie)}
        {row('a life', 'every day, as a square', onSquares)}
        {row('what matters', 'worth it & regret, your compass', onMatters)}
        {row('my framed days', 'the days you framed, oldest first', onFramed)}
        {row('my paintings', 'the paintings you kept', onPaintings)}
      </div>
    </main>
  )
}
