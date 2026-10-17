import { useEffect, useRef, useState } from 'react'
import { Chevron } from './Today'
import { fromIso, todayIso } from '../lib/dates'
import { DEFAULT_LIFESPAN, lifeCounts } from '../lib/life'
import type { Profile } from '../lib/profile'

type Props = {
  profile: Profile | null
  /** First run asks "how many squares?" and ends on "start painting"; from settings every change saves itself. */
  mode?: 'onboarding' | 'settings'
  onBack: () => void
  /** Rejects if it couldn't be saved. */
  onSave: (p: Profile) => Promise<void>
}

const MIN_YEARS = 1
const MAX_YEARS = 130
const fmt = (n: number) => n.toLocaleString('en-US')

// "How many squares?": birth date and hoped-for lifespan, and what they add up to.
// The one screen where a number belongs: it's there to feel how finite the squares are.
export function Setup({ profile, mode = 'onboarding', onBack, onSave }: Props) {
  const today = todayIso()
  const [born, setBorn] = useState(profile?.born ?? '')
  const [lifespan, setLifespanValue] = useState(profile?.lifespan ?? DEFAULT_LIFESPAN)
  // What's typed in the years box (may be mid-edit, e.g. empty); the stepper keeps both in step.
  const [yearsText, setYearsText] = useState(String(lifespan))
  const setLifespan = (n: number) => {
    setLifespanValue(n)
    setYearsText(String(n))
  }
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const valid = born > '1900-01-01' && born <= today
  const c = valid ? lifeCounts(born, lifespan, today) : null
  const [inYears, setInYears] = useState(false)
  // Years from the squares themselves, so spent + to paint always add up to the lifespan.
  const spentYears = c ? Math.round((c.sofar / c.total) * lifespan) : 0

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

  // From settings: save quietly a moment after the last change (rapid stepper taps become one save).
  // If it fails (offline), say so softly and try again when the connection is back.
  const editing = mode === 'settings'
  const saved = useRef(profile ? `${profile.born}|${profile.lifespan}` : '')
  const [offline, setOffline] = useState(false)
  const latest = useRef({ born, lifespan, valid })
  latest.current = { born, lifespan, valid }
  const flush = async () => {
    const { born, lifespan, valid } = latest.current
    const key = `${born}|${lifespan}`
    if (!valid || key === saved.current) return
    try {
      await onSave({ born, lifespan })
      saved.current = key
      setOffline(false)
    } catch (e) {
      console.error('Could not save profile', e)
      setOffline(true)
    }
  }
  useEffect(() => {
    if (!editing) return
    const t = setTimeout(flush, 600)
    return () => clearTimeout(t)
  }, [editing, born, lifespan]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!editing) return
    const retry = () => void flush()
    window.addEventListener('online', retry)
    return () => window.removeEventListener('online', retry)
  }, [editing]) // eslint-disable-line react-hooks/exhaustive-deps
  const back = () => {
    if (editing) void flush() // don't lose a change made just before leaving
    onBack()
  }

  return (
    <main className="setup">
      <button className="setup-back" aria-label="Back" onClick={back}>
        <Chevron dir="left" />
      </button>

      <div className="setup-body">
        <h1 className="setup-title">
          {editing ? (
            'square settings'
          ) : (
            <>
              how many
              <br />
              squares?
            </>
          )}
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
                onClick={() => setLifespan(Math.max(MIN_YEARS, lifespan - 1))}
              >
                –
              </button>
              <label className="setup-years">
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={3}
                  aria-label="years"
                  value={yearsText}
                  onFocus={(e) => e.currentTarget.select()}
                  onChange={(e) => {
                    const t = e.target.value.replace(/\D/g, '')
                    setYearsText(t)
                    const n = Number(t)
                    if (n >= MIN_YEARS && n <= MAX_YEARS) setLifespan(n)
                  }}
                  onBlur={() => setYearsText(String(lifespan))}
                  onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
                />
                <span>years</span>
              </label>
              <button
                aria-label="more years"
                disabled={lifespan >= MAX_YEARS}
                onClick={() => setLifespan(Math.min(MAX_YEARS, lifespan + 1))}
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
              {inYears ? `${spentYears} years` : fmt(c.sofar)} spent ·{' '}
              <strong>
                {inYears ? `${lifespan - spentYears} years` : fmt(c.left)} ({c.percentLeft}%) to paint
              </strong>{' '}
              · {/* Flip between squares and years; it opens on squares every time. */}
              <button className="setup-unit" onClick={() => setInYears(!inYears)}>
                {inYears ? 'in squares' : 'in years'}
              </button>
            </div>
          )}
        </div>
      </div>

      {editing ? (
        offline && <p className="setup-error">couldn't save, check your connection</p>
      ) : (
        <>
          {error && <p className="setup-error">{error}</p>}
          <button className="pill setup-go" disabled={!valid || busy} onClick={save}>
            {busy ? 'saving…' : 'start painting'}
          </button>
        </>
      )}
    </main>
  )
}
