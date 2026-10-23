import type { Profile } from '../lib/profile'
import { Chevron } from './Today'

type Props = {
  profile: Profile | null
  onPie: () => void
  onSquares: () => void
  onMatters: () => void
  onFramed: () => void
  onPaintings: () => void
}

// my days (the menu): everything about your days in one place, as doors, never a dashboard of numbers: a life pie,
// all your squares, what matters, the days you framed and the paintings you kept. (The pie as a picture here read
// techy and alone; a row until there's a better idea.)
export function MyDays({ profile, onPie, onSquares, onMatters, onFramed, onPaintings }: Props) {
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
      <div className="settings-rows is-last">
        {profile && row('a life pie', 'your days, in slices', onPie)}
        {row('all my squares', 'a life, day by day', onSquares)}
        {row('what matters', 'worth it & regret, your compass', onMatters)}
        {row('my framed days', 'the days you framed, oldest first', onFramed)}
        {row('my paintings', 'the paintings you kept', onPaintings)}
      </div>
    </main>
  )
}
