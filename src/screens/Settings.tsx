import { ConfirmDialog } from '../components/ConfirmDialog'
import { Footer } from '../components/Footer'
import { Waiting } from '../components/Waiting'
import { useState } from 'react'
import { deleteMyAccount } from '../lib/account'
import { fromIso, todayIso } from '../lib/dates'
import { lifeCounts } from '../lib/life'
import { reportError } from '../lib/report'
import type { Profile } from '../lib/profile'
import { LOCK_CHOICES, lockAfter, setLockAfter } from '../lib/lock'
import { setSoundOn, soundOn, soundOnChime } from '../lib/sound'
import { Chevron, SpeakerIcon } from './Today'

type Props = {
  profile: Profile | null
  onSquares: () => void
  /** After the account is gone: "Your account has been deleted.", then the sign-in screen. */
  onDeleted: () => void
  onPrivacy: () => void
  onTerms: () => void
  onExport: () => void
}

const fmt = (n: number) => n.toLocaleString('en-US')

// Settings: one short list (what's about you and your days lives in my days); rows open their own screen, sound and
// the lock act right here (sign out is the menu's last line), and deleting the account asks once more, with "delete" typed, before it goes.
export function Settings({ profile, onSquares, onDeleted, onPrivacy, onTerms, onExport }: Props) {
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
  // failed: 'offline' when it couldn't reach the account, 'error' when the account said no.
  const [deleting, setDeleting] = useState<'idle' | 'deleting' | 'offline' | 'error'>('idle')
  const remove = () => {
    setAsking(false)
    setDeleting('deleting')
    // The hourglass stays at least a moment, so a quick delete still shows it happening.
    Promise.all([deleteMyAccount(), new Promise((r) => setTimeout(r, 1500))])
      .then(onDeleted)
      .catch((e) => {
        reportError('delete account', e)
        const msg = String((e as { message?: unknown })?.message ?? e)
        setDeleting(!navigator.onLine || /fetch|network|load failed/i.test(msg) ? 'offline' : 'error')
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
        {row('how many squares', summary, onSquares)}
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
            <span className="settings-sub">sign out after I’ve been away</span>
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
        {row('export my data', 'a Word copy of your squares and moments', onExport)}
        <button className="settings-row" disabled={deleting === 'deleting'} onClick={() => setAsking(true)}>
          <span>
            <span className="settings-label">delete my account</span>
            <span className="settings-sub">your squares, notes and lists, for good</span>
          </span>
        </button>
      </div>
      {/* Couldn't delete: the same ink bubble as a save that can't get through, under the top bar. */}
      {(deleting === 'offline' || deleting === 'error') && (
        <div className="sync-bubble" role="alert">
          <p>
            {deleting === 'offline'
              ? "Not deleted. squared couldn't reach your account. Check your connection."
              : 'Not deleted. Something went wrong on our side. Try again, or send feedback.'}
          </p>
          <span className="sync-actions">
            <button onClick={remove}>try again</button>
            <button onClick={() => setDeleting('idle')}>close</button>
          </span>
        </div>
      )}
      {/* Deleting: the hourglass over the whole screen, until the account is gone. */}
      {deleting === 'deleting' && (
        <div className="deleting">
          <Waiting line="deleting your account…" />
        </div>
      )}

      <Footer
        links={[
          ['privacy', onPrivacy],
          ['terms', onTerms],
        ]}
      />
      {asking && (
        <ConfirmDialog
          title="Delete your account?"
          body={"Everything goes for good.\nIt can't be undone."}
          confirm="delete"
          typeToConfirm="delete"
          typeLabel={'have your copy, or don’t need one?\ntype “delete” to go ahead'}
          aside={
            <button
              className="pill is-keyline confirm-export"
              onClick={() => {
                setAsking(false)
                onExport()
              }}
            >
              export my data
            </button>
          }
          onConfirm={remove}
          onCancel={() => setAsking(false)}
        />
      )}
    </main>
  )
}
