import type { ReactNode } from 'react'
import { LifeGlass } from './LifeGlass'
import { todayIso } from '../lib/dates'
import { lifeCounts } from '../lib/life'
import type { Profile } from '../lib/profile'

/** The three ways to see a life: one square per year, per month, or per day. */
export type Resolution = 'years' | 'months' | 'days'

type Props = {
  profile: Profile
  current: Resolution
  /** Jump to another resolution (absent while that one isn't built yet). */
  onPick: (r: Resolution) => void
  ready?: Resolution[]
  /** Beside the title and its glass (the days list's filter). */
  extra?: ReactNode
}

const fmt = (n: number) => n.toLocaleString('en-US')

// "a life", and under it a quiet segmented control — 95 years · 1,140 months · 34,699 days —
// the current one raised, the others straight to that view (the same control as the pie's filter).
export function LifeHead({ profile, current, onPick, ready = ['years', 'months', 'days'], extra }: Props) {
  const { total } = lifeCounts(profile.born, profile.lifespan, todayIso())
  const items: [Resolution, string][] = [
    ['years', `${profile.lifespan} years`],
    ['months', `${fmt(profile.lifespan * 12)} months`],
    ['days', `${fmt(total)} days`],
  ]
  return (
    <div className="life-head">
      <div className="life-title-row">
        <h1 className="life-title">a life</h1>
        <LifeGlass profile={profile} unit={current} />
        {extra}
      </div>
      <div className="seg" role="group" aria-label="A life in">
        {items.map(([r, label]) => (
          <button
            key={r}
            className={r === current ? 'is-on' : undefined}
            aria-pressed={r === current}
            disabled={r !== current && !ready.includes(r)}
            onClick={() => r !== current && onPick(r)}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  )
}
