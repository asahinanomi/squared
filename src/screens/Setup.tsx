import { useState } from 'react'
import { Chevron } from './Today'
import { fromIso, todayIso } from '../lib/dates'
import { DEFAULT_LIFESPAN, lifeCounts } from '../lib/life'
import type { Profile } from '../lib/profile'

type Props = {
  profile: Profile | null
  onBack: () => void
  /** Rejects if it couldn't be saved. */
  onSave: (p: Profile) => Promise<void>
}

const MIN_YEARS = 1
const MAX_YEARS = 130
const fmt = (n: number) => n.toLocaleString('en-US')

// "How many squares?": birth date and hoped-for lifespan, and what they add up to.
// The one screen where a number belongs: it's there to feel how finite the squares are.
export function Setup({ profile, onBack, onSave }: Props) {
  const today = todayIso()
  const [born, setBorn] = useState(profile?.born ?? '')
  const [lifespan, setLifespan] = useState(profile?.lifespan ?? DEFAULT_LIFESPAN)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const valid = born > '1900-01-01' && born <= today
  const c = valid ? lifeCounts(born, lifespan, today) : null

  const save = async () => {
    if (!valid) return
    setBusy(true)
    setError(null)
    try {
      await onSave({ born, lifespan })
    } catch (e) {
      console.error('Could not save profile', e)
      const code = (e as { code?: string })?.code
      setError(
        code === 'PGRST205' || code === '42P01'
          ? "couldn't save: the update (0005) hasn't been run in Supabase yet"
          : "couldn't save, check your connection and try again",
      )
      setBusy(false)
    }
  }

  return (
    <main className="setup">
      <button className="setup-back" aria-label="Back" onClick={onBack}>
        <Chevron dir="left" />
      </button>

      <div className="setup-body">
        <h1 className="setup-title">
          how many
          <br />
          squares?
        </h1>

        <div className="setup-fields">
          <div>
            <label className="setup-label" htmlFor="born">
              when were you born?
            </label>
            <div className="setup-field">
              <span className={born ? '' : 'setup-placeholder'}>
                {born
                  ? fromIso(born).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
                  : 'pick a date'}
              </span>
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <rect x="3" y="5" width="18" height="16" rx="2.5" />
                <path d="M3 9 H21 M8 3 V6 M16 3 V6" />
              </svg>
              {/* The real (native) date picker, invisible over the field. */}
              <input
                id="born"
                type="date"
                min="1900-01-02"
                max={today}
                value={born}
                onChange={(e) => setBorn(e.target.value)}
                onClick={(e) => {
                  // Open the picker wherever the field is tapped (some browsers only open it on the icon).
                  try {
                    e.currentTarget.showPicker()
                  } catch {
                    /* older browsers open it themselves */
                  }
                }}
              />
            </div>
          </div>

          <div>
            <span className="setup-label" id="lifespan-label">
              how long do you hope to live?
            </span>
            <div className="setup-field setup-stepper" role="group" aria-labelledby="lifespan-label">
              <button
                aria-label="fewer years"
                disabled={lifespan <= MIN_YEARS}
                onClick={() => setLifespan((n) => Math.max(MIN_YEARS, n - 1))}
              >
                –
              </button>
              <span aria-live="polite">{lifespan} years</span>
              <button
                aria-label="more years"
                disabled={lifespan >= MAX_YEARS}
                onClick={() => setLifespan((n) => Math.min(MAX_YEARS, n + 1))}
              >
                +
              </button>
            </div>
          </div>
        </div>

        <div className="setup-hero" aria-live="polite">
          <div className="setup-thats">that's</div>
          <div className="setup-total">{c ? fmt(c.total) : '—'}</div>
          <div className="setup-squares">squares</div>
          {c && (
            <div className="setup-line">
              {c.age} years · {fmt(c.sofar)} so far ·{' '}
              <strong>
                {fmt(c.left)} left · {c.percentLeft}%
              </strong>
            </div>
          )}
        </div>
      </div>

      {error && <p className="setup-error">{error}</p>}
      <button className="pill setup-go" disabled={!valid || busy} onClick={save}>
        {busy ? 'saving…' : 'start painting'}
      </button>
    </main>
  )
}
