import { ConfirmDialog } from '../components/ConfirmDialog'
import { Footer } from '../components/Footer'
import { useState } from 'react'
import { deleteMyAccount } from '../lib/account'
import { fromIso, todayIso } from '../lib/dates'
import { lifeCounts } from '../lib/life'
import type { Profile } from '../lib/profile'
import { LOCK_CHOICES, lockAfter, setLockAfter } from '../lib/lock'
import { setSoundOn, soundOn, soundOnChime } from '../lib/sound'
import { Chevron, SpeakerIcon } from './Today'

type Props = {
  profile: Profile | null
  onSquares: () => void
  /** The signed-in email, if known. */
  email?: string
  onSignOut: () => void
  /** After the account is gone: back to the sign-in screen. */
  onDeleted: () => void
  onPrivacy: () => void
  onTerms: () => void
  onExport: () => void
}

const fmt = (n: number) => n.toLocaleString('en-US')

// Settings: one short list (what's about you and your days lives in my days); rows open their own screen, sound and
// sign out act right here, and deleting the account asks once more, with "delete" typed, before it goes.
export function Settings({ profile, onSquares, email, onSignOut, onDeleted, onPrivacy, onTerms, onExport }: Props) {
  const summary = profile
    ? [
        fromIso(profile.born).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        `${profile.lifespan} years`,
        `${fmt(lifeCounts(profile.born, profile.lifespan, todayIso()).total)} squares`,
      ].join(' · ')
    : 'birth date & lifespan'
  const [sound, setSound] = useState(soundOn)
  const [lock, setLock] = useState(lockAfter)
  const toggleSound = () => {
    setSoundOn(!sound)
    setSound(!sound)
    if (!sound) soundOnChime() // back on: you hear it
  }
  const [asking, setAsking] = useState(false)
  const [deleting, setDeleting] = useState<'idle' | 'deleting' | 'failed'>('idle')
  const remove = () => {
    setAsking(false)
    setDeleting('deleting')
    deleteMyAccount()
      .then(onDeleted)
      .catch((e) => {
        console.error('Could not delete the account', e)
        setDeleting('failed')
      })
  }
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
    <main className="settings">
      <h1 className="settings-title">settings</h1>

      <div className="settings-rows is-last">
        {row('square settings', summary, onSquares)}
        <button className="settings-row" role="switch" aria-checked={sound} onClick={() => toggleSound()}>
          <span>
            <span className="settings-label">sound</span>
            <span className="settings-sub">the brush on paper · a soft tone when done</span>
          </span>
          <span className="settings-switch" aria-hidden="true">
            <SpeakerIcon on={sound} />
          </span>
        </button>
        {/* Lock when I leave: a private journal locks itself; only how soon is yours to choose (never isn't). */}
        <div className="settings-row is-lock">
          <span>
            <span className="settings-label">lock when I leave</span>
            <span className="settings-sub">signs out when you're away this long</span>
          </span>
          <span className="seg settings-seg" role="group" aria-label="Lock when I leave">
            {LOCK_CHOICES.map(([id, label]) => (
              <button
                key={id}
                className={id === lock ? 'is-on' : undefined}
                aria-pressed={id === lock}
                onClick={() => {
                  setLockAfter(id)
                  setLock(id)
                }}
              >
                {label}
              </button>
            ))}
          </span>
        </div>
        {row('export my data', 'a Word copy of your squares and notes', onExport)}
        <button className="settings-row" onClick={onSignOut}>
          <span>
            <span className="settings-label">sign out</span>
            <span className="settings-sub">{email ? `signed in as ${email}` : 'signed in'}</span>
          </span>
        </button>
        <button className="settings-row" disabled={deleting === 'deleting'} onClick={() => setAsking(true)}>
          <span>
            <span className="settings-label">{deleting === 'deleting' ? 'deleting…' : 'delete my account'}</span>
            <span className="settings-sub">your squares, notes and lists, for good</span>
          </span>
        </button>
      </div>
      {deleting === 'failed' && <p className="settings-note">couldn't delete, check your connection and try again</p>}

      <Footer
        links={[
          ['privacy', onPrivacy],
          ['terms', onTerms],
        ]}
      />
      {asking && (
        <ConfirmDialog
          title="Delete your account?"
          body="Your squares, notes, lists and settings go for good. It can't be undone."
          confirm="delete"
          typeToConfirm="delete"
          onConfirm={remove}
          onCancel={() => setAsking(false)}
        />
      )}
    </main>
  )
}
