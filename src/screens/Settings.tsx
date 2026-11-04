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
import { SpeakerIcon } from './Today'

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
  // Why they're leaving: optional, sent with the delete, kept with no name (kept here too, for "try again").
  const [why, setWhy] = useState('')
  // failed: 'offline' when it couldn't reach the account, 'error' when the account said no.
  const [deleting, setDeleting] = useState<'idle' | 'deleting' | 'offline' | 'error'>('idle')
  const remove = () => {
    setAsking(false)
    setDeleting('deleting')
    // The hourglass stays at least a moment, so a quick delete still shows it happening.
    Promise.all([deleteMyAccount(why), new Promise((r) => setTimeout(r, 1500))])
      .then(onDeleted)
      .catch((e) => {
        reportError('delete account', e)
        const msg = String((e as { message?: unknown })?.message ?? e)
        setDeleting(!navigator.onLine || /fetch|network|load failed/i.test(msg) ? 'offline' : 'error')
      })
  }
  // Every row carries its own small icon at the right, as sound has its speaker: what it is, known at a glance
  // (nomi, Nov 4, 2026).
  // Its line under the name only where it says something the name and icon don't (nomi, Nov 4, 2026: less to read).
  const row = (label: string, sub: string | null, go: () => void, icon: React.ReactNode) => (
    <button className="settings-row" onClick={go}>
      <span>
        <span className="settings-label">{label}</span>
        {sub && <span className="settings-sub">{sub}</span>}
      </span>
      <span className="settings-switch" aria-hidden="true">
        {icon}
      </span>
    </button>
  )
  return (
    <main className="settings">
      <h1 className="settings-title">settings</h1>

      <div className="settings-rows is-last">
        {row('how many squares', summary, onSquares, <SquaresIcon />)}
        <button className="settings-row" role="switch" aria-checked={sound} onClick={() => toggleSound()}>
          <span>
            <span className="settings-label">sound</span>
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
          <span className="settings-switch" aria-hidden="true">
            <LockIcon />
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
        {row('export my data', null, onExport, <ExportIcon />)}
        <button className="settings-row" disabled={deleting === 'deleting'} onClick={() => setAsking(true)}>
          <span>
            <span className="settings-label">delete my account</span>
          </span>
          {/* A bin, where the sound row has its speaker: known at a glance, no reading needed (nomi, Nov 4, 2026). */}
          <span className="settings-switch" aria-hidden="true">
            <BinIcon />
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
          typeLabel={'type “delete” to go ahead'}
          aside={
            <>
              {/* A copy first, if you want one: a quiet link with the warning, not a big button (nomi, Nov 4, 2026). */}
              <button
                className="confirm-export"
                onClick={() => {
                  setAsking(false)
                  onExport()
                }}
              >
                export my data first
              </button>
              <label className="confirm-type confirm-why">
                <span>why are you leaving? (optional)</span>
                <textarea rows={2} maxLength={2000} value={why} onChange={(e) => setWhy(e.target.value)} />
              </label>
            </>
          }
          onConfirm={remove}
          onCancel={() => setAsking(false)}
        />
      )}
    </main>
  )
}

/** A bin: the lid, its handle, and the can with two lines, drawn like the speaker beside it. */
function BinIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 6.5 H20" />
      <path d="M9.5 6.5 V4 H14.5 V6.5" />
      <path d="M6 6.5 L7 20 H17 L18 6.5" />
      <path d="M10.5 10.5 V16.5 M13.5 10.5 V16.5" />
    </svg>
  )
}

/** Four squares: days, as on the view switch. */
function SquaresIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round">
      <rect x="4" y="4" width="6.5" height="6.5" rx="1.5" />
      <rect x="13.5" y="4" width="6.5" height="6.5" rx="1.5" />
      <rect x="4" y="13.5" width="6.5" height="6.5" rx="1.5" />
      <rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.5" />
    </svg>
  )
}

/** A padlock. */
function LockIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="5" y="10.5" width="14" height="10" rx="2" />
      <path d="M8.5 10.5 V7.5 a3.5 3.5 0 0 1 7 0 V10.5" />
    </svg>
  )
}

/** A copy coming down to you: an arrow into a tray. */
function ExportIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 4 V14.5 M7.5 10 L12 14.5 L16.5 10" />
      <path d="M4.5 15.5 V19.5 H19.5 V15.5" />
    </svg>
  )
}
