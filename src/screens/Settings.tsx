import { fromIso, todayIso } from '../lib/dates'
import { lifeCounts } from '../lib/life'
import type { Profile } from '../lib/profile'
import { Chevron } from './Today'

type Props = {
  profile: Profile | null
  /** Back to wherever settings was opened from. */
  onBack: () => void
  onSquares: () => void
  onMatters: () => void
  onAccount: () => void
  onPrivacy: () => void
}

const fmt = (n: number) => n.toLocaleString('en-US')

// Settings: one quiet list; each row opens its own screen.
export function Settings({ profile, onBack, onSquares, onMatters, onAccount, onPrivacy }: Props) {
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
        <button className="settings-row" onClick={onMatters}>
          <span>
            <span className="settings-label">what matters</span>
            <span className="settings-sub">mattered &amp; empty — your compass</span>
          </span>
          <Chevron dir="right" />
        </button>
        <button className="settings-row" onClick={onAccount}>
          <span>
            <span className="settings-label">account</span>
            <span className="settings-sub">sign out · delete my account</span>
          </span>
          <Chevron dir="right" />
        </button>
      </div>

      <div className="settings-foot-links">
        <button onClick={onPrivacy}>privacy</button>
      </div>
      <p className="settings-foot">squared.today</p>
    </main>
  )
}
