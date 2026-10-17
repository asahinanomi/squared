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
}

const fmt = (n: number) => n.toLocaleString('en-US')

// "a life", and under it "95 years · 1,140 months · 34,699 days": the current one highlighted,
// the others links straight to that view.
export function LifeHead({ profile, current, onPick, ready = ['years', 'months', 'days'] }: Props) {
  const { total } = lifeCounts(profile.born, profile.lifespan, todayIso())
  const items: [Resolution, string][] = [
    ['years', `${profile.lifespan} years`],
    ['months', `${fmt(profile.lifespan * 12)} months`],
    ['days', `${fmt(total)} days`],
  ]
  return (
    <div className="life-head">
      <h1 className="life-title">a life</h1>
      <p className="life-sub">
        {items.map(([r, label], i) => (
          <span key={r}>
            {i > 0 && <span className="dot">·</span>}
            {r === current ? (
              <span className="is-on" aria-current="page">
                {label}
              </span>
            ) : ready.includes(r) ? (
              <button className="life-link" onClick={() => onPick(r)}>
                {label}
              </button>
            ) : (
              <span>{label}</span>
            )}
          </span>
        ))}
      </p>
    </div>
  )
}
