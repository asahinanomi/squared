import type { Days } from '../lib/days'
import type { Profile } from '../lib/profile'
import { PieThumb } from './Pie'
import { Chevron } from './Today'

type Props = {
  days: Days
  profile: Profile | null
  onPie: () => void
  onSquares: () => void
  onMatters: () => void
  onFramed: () => void
  onPaintings: () => void
}

// my days (the menu): everything about your days in one place, as doors, never a dashboard of numbers. A life as a
// pie is its one picture (tap it for the full pie); then all your squares, what matters, the days you framed and
// the paintings you kept.
export function MyDays({ days, profile, onPie, onSquares, onMatters, onFramed, onPaintings }: Props) {
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
      {profile && (
        <button className="my-days-pie" onClick={onPie} aria-label="a life pie, in slices">
          <PieThumb days={days} profile={profile} />
          <span className="my-days-pie-label">
            a life pie
            <Chevron dir="right" />
          </span>
        </button>
      )}
      <div className="settings-rows is-last">
        {row('all my squares', 'a life, day by day', onSquares)}
        {row('what matters', 'worth it & regret, your compass', onMatters)}
        {row('my framed days', 'the days you framed, oldest first', onFramed)}
        {row('my paintings', 'the paintings you kept', onPaintings)}
      </div>
    </main>
  )
}
