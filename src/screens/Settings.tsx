import { fromIso, todayIso } from '../lib/dates'
import { lifeCounts } from '../lib/life'
import type { Profile } from '../lib/profile'
import { Chevron } from './Today'

type Props = {
  profile: Profile | null
  /** Back to wherever settings was opened from. */
  onBack: () => void
  onSquares: () => void
}

const fmt = (n: number) => n.toLocaleString('en-US')

/** Rows that arrive in later phases: shown, quietly, but not tappable yet. */
const SOON: [string, string][] = [
  ['reminders', 'a gentle daily nudge to paint'],
  ['my data', 'export & back up your squares'],
  ['account', 'email · sign out'],
]

// Settings: one quiet list; each row opens its own screen.
export function Settings({ profile, onBack, onSquares }: Props) {
  const summary = profile
    ? [
        fromIso(profile.born).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        `${profile.lifespan} years`,
        `${fmt(lifeCounts(profile.born, profile.lifespan, todayIso()).total)} squares`,
      ].join(' · ')
    : 'birth date & lifespan'
  return (
    <main className="settings">
      <button className="setup-back" aria-label="Back" onClick={onBack}>
        <Chevron dir="left" />
      </button>
      <h1 className="settings-title">settings</h1>

      <div className="settings-rows">
        <button className="settings-row" onClick={onSquares}>
          <span>
            <span className="settings-label">square settings</span>
            <span className="settings-sub">{summary}</span>
          </span>
          <Chevron dir="right" />
        </button>
        {SOON.map(([label, sub]) => (
          <div key={label} className="settings-row is-soon" aria-disabled="true">
            <span>
              <span className="settings-label">
                {label} <span className="settings-soon">soon</span>
              </span>
              <span className="settings-sub">{sub}</span>
            </span>
            <Chevron dir="right" />
          </div>
        ))}
      </div>

      <p className="settings-foot">squared.today</p>
    </main>
  )
}
