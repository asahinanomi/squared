import { useState } from 'react'
import { fromIso, todayIso } from '../lib/dates'
import { lifeCounts } from '../lib/life'
import type { Profile } from '../lib/profile'
import { setSoundOn, soundOn } from '../lib/sound'
import { Chevron } from './Today'

type Props = {
  profile: Profile | null
  /** Back to wherever settings was opened from. */
  onBack: () => void
  onSquares: () => void
  onMatters: () => void
  onAccount: () => void
  onPrivacy: () => void
  onTerms: () => void
}

const fmt = (n: number) => n.toLocaleString('en-US')

// Settings: one quiet list; each row opens its own screen.
export function Settings({ profile, onBack, onSquares, onMatters, onAccount, onPrivacy, onTerms }: Props) {
  const summary = profile
    ? [
        fromIso(profile.born).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        `${profile.lifespan} years`,
        `${fmt(lifeCounts(profile.born, profile.lifespan, todayIso()).total)} squares`,
      ].join(' · ')
    : 'birth date & lifespan'
  const [sound, setSound] = useState(soundOn)
  const toggleSound = () => {
    setSoundOn(!sound)
    setSound(!sound)
  }
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
        <button className="settings-row" role="switch" aria-checked={sound} onClick={() => toggleSound()}>
          <span>
            <span className="settings-label">sound</span>
            <span className="settings-sub">the brush on paper · a soft tone when done</span>
          </span>
          <span className="settings-switch">{sound ? 'on' : 'off'}</span>
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
        <span aria-hidden="true">·</span>
        <button onClick={onTerms}>terms</button>
      </div>
      <p className="settings-foot">squared.today</p>
    </main>
  )
}
