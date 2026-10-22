import { useEffect, useRef, useState } from 'react'
import { fromIso, todayIso } from '../lib/dates'
import { lifeCounts } from '../lib/life'
import { MAX_CHARS, newEntry, pushMatters, saveMatters, type Kind } from '../lib/matters'
import { PAINTS, paintHex } from '../lib/paints'
import type { Profile } from '../lib/profile'
import { reportError } from '../lib/report'
import { Chevron } from './Today'

type Props = {
  /** Opened with ?welcome to try it: nothing is saved. */
  tryOut?: boolean
  /** Saves how many squares (birth date and lifespan); rejects if it couldn't be saved. */
  onSquares: (p: Profile) => Promise<void>
  /** Off to today's square: onboarding is over. */
  onDone: () => void
}

const FIELDS: Record<Kind, { dot: string; holders: string[] }> = {
  meaningful: { dot: paintHex('green'), holders: ['time with family', 'a long walk', 'making something'] },
  wasted: { dot: paintHex('red'), holders: ['scrolling', 'busywork', 'just waiting'] },
}
const WORDS = { green: 'mattered', red: 'empty', grey: 'slipped' } as const
const AVERAGE = 79 // the stepper's first tap lands here
const MIN_YEARS = 1
const MAX_YEARS = 130
const fmt = (n: number) => n.toLocaleString('en-US')

const lines = (l: string[]) => l.map((t) => t.trim()).filter(Boolean)

/** Three short lines to fill in, one per row, each with its paint's dot. */
function Lines({
  kind,
  values,
  onChange,
  onEnter,
}: {
  kind: Kind
  values: string[]
  onChange: (v: string[]) => void
  onEnter: () => void
}) {
  const { dot, holders } = FIELDS[kind]
  const refs = useRef<(HTMLInputElement | null)[]>([])
  // The first line is ready to type in (no scroll jump while the screen slides in).
  useEffect(() => {
    const t = setTimeout(() => refs.current[0]?.focus({ preventScroll: true }), 300)
    return () => clearTimeout(t)
  }, [])
  return (
    <ul className="welcome-lines">
      {holders.map((h, i) => (
        <li key={h}>
          <span className="welcome-dot" style={{ background: dot }} aria-hidden="true" />
          <input
            ref={(el) => {
              refs.current[i] = el
            }}
            maxLength={MAX_CHARS}
            placeholder={h}
            autoComplete="off"
            enterKeyHint={i < 2 ? 'next' : 'done'}
            aria-label={`${kind === 'meaningful' ? 'meaningful' : 'empty'}, line ${i + 1}`}
            value={values[i]}
            onChange={(e) => onChange(values.map((v, j) => (j === i ? e.target.value : v)))}
            onKeyDown={(e) => {
              if (e.key !== 'Enter') return
              e.preventDefault()
              if (i < 2) refs.current[i + 1]?.focus()
              else onEnter()
            }}
          />
        </li>
      ))}
    </ul>
  )
}

// Onboarding: one journey for anyone whose squares aren't set. What squared is, what makes a day meaningful,
// what makes one empty (both skippable; the lines go straight into settings → what matters), then how many
// squares you have (never filled in for you, never skipped, 18 and over), and "start painting" opens today's
// first square. Lab: https://claude.ai/artifact/TdNFeCnenYybjepoDhUt9C
export function Welcome({ tryOut, onSquares, onDone }: Props) {
  const [step, setStep] = useState(0)
  const [meaningful, setMeaningful] = useState(['', '', ''])
  const [wasted, setWasted] = useState(['', '', ''])
  const m = lines(meaningful)
  const e = lines(wasted)

  // On to the last step, keeping what was written (the same lists as settings → what matters).
  const toSquares = (mine: string[], empty: string[]) => {
    if ((mine.length || empty.length) && !tryOut) {
      const saved = saveMatters({
        meaningful: mine.map((text) => ({ ...newEntry(), text })),
        wasted: empty.map((text) => ({ ...newEntry(), text })),
      })
      pushMatters(saved).catch((err) => console.error('Could not save what matters', err))
    }
    setStep(3)
  }
  const back = (to: number) => (
    <button className="back-btn welcome-back" onClick={() => setStep(to)}>
      <Chevron dir="left" />
      back
    </button>
  )

  return (
    <main className="welcome">
      <div className="welcome-dots" aria-hidden="true">
        {[0, 1, 2, 3].map((i) => (
          <i key={i} className={i <= step ? 'is-on' : undefined} />
        ))}
      </div>

      {step === 0 ? (
        <section className="welcome-step is-pause" key="intro" aria-label="Step 1 of 4">
          {/* What squared is, as one short paragraph; then the question on its own; then the paint. */}
          <div className="welcome-intro">
            <p>welcome to squared.</p>
            <p>one square for every day of your life.</p>
            <p>Each day, ask yourself</p>
          </div>
          <h1 className="welcome-big">
            did I spend <u>Today</u> meaningfully?
          </h1>
          <p className="welcome-then">then paint its square.</p>
          <div className="welcome-trio" aria-hidden="true">
            {PAINTS.map((p) => (
              <span key={p.id}>
                <i style={{ background: p.hex }} />
                {WORDS[p.id]}
              </span>
            ))}
          </div>
          <div className="welcome-foot">
            <button className="pill" onClick={() => setStep(1)}>
              let's begin
            </button>
          </div>
        </section>
      ) : step === 1 ? (
        <section className="welcome-step" key="meaningful" aria-label="Step 2 of 4">
          {back(0)}
          <h1 className="welcome-q">
            what makes a day feel <u>meaningful</u>?
          </h1>
          <Lines kind="meaningful" values={meaningful} onChange={setMeaningful} onEnter={() => setStep(2)} />
          <div className="welcome-foot">
            <button className="pill" onClick={() => setStep(2)}>
              next
            </button>
            <button
              className="welcome-link"
              onClick={() => {
                setMeaningful(['', '', ''])
                setStep(2)
              }}
            >
              skip this step
            </button>
          </div>
        </section>
      ) : step === 2 ? (
        <section className="welcome-step" key="empty" aria-label="Step 3 of 4">
          {back(1)}
          <h1 className="welcome-q">
            and what makes a day feel <u>empty</u>?
          </h1>
          <Lines kind="wasted" values={wasted} onChange={setWasted} onEnter={() => toSquares(m, e)} />
          <div className="welcome-foot">
            <button className="pill" onClick={() => toSquares(m, e)}>
              next
            </button>
            <button
              className="welcome-link"
              onClick={() => {
                setWasted(['', '', ''])
                toSquares(m, [])
              }}
            >
              skip this step
            </button>
          </div>
        </section>
      ) : (
        <Squares back={back(2)} tryOut={tryOut} onSquares={onSquares} onDone={onDone} />
      )}
    </main>
  )
}

/** The last step: how many squares you have. Both answers are yours to give (nothing filled in, no skip). */
function Squares({
  back,
  tryOut,
  onSquares,
  onDone,
}: {
  back: React.ReactNode
  tryOut?: boolean
  onSquares: (p: Profile) => Promise<void>
  onDone: () => void
}) {
  const today = todayIso()
  // 18 and over: the picker stops at the day 18 years ago.
  const adult = (() => {
    const d = fromIso(today)
    d.setFullYear(d.getFullYear() - 18)
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  })()
  const [born, setBorn] = useState('')
  const [lifespan, setLifespanValue] = useState<number | null>(null)
  const [yearsText, setYearsText] = useState('')
  const setLifespan = (n: number) => {
    setLifespanValue(n)
    setYearsText(String(n))
  }
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const young = !!born && born > adult
  const valid = born > '1900-01-01' && !young && !!lifespan
  const c = valid ? lifeCounts(born, lifespan!, today) : null

  const start = async () => {
    if (!valid) return
    if (tryOut) return onDone()
    setBusy(true)
    setError(null)
    try {
      await onSquares({ born, lifespan: lifespan! })
      onDone()
    } catch (e) {
      console.error('Could not save profile', e)
      reportError('save profile', e)
      setError("couldn't save, check your connection and try again")
      setBusy(false)
    }
  }

  return (
    <section className="welcome-step welcome-squares" key="squares" aria-label="Step 4 of 4">
      {back}
      <p className="welcome-eyebrow">last thing.</p>
      <h1 className="welcome-q">how many squares do you have?</h1>

      <div className="setup-fields welcome-fields">
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
            <input
              id="born"
              type="date"
              min="1900-01-02"
              max={adult}
              value={born}
              onChange={(e) => setBorn(e.target.value)}
              onClick={(e) => {
                try {
                  e.currentTarget.showPicker()
                } catch {
                  /* older browsers open it themselves */
                }
              }}
            />
          </div>
          {young && <p className="setup-hint welcome-young">squared is for people 18 and over.</p>}
        </div>

        <div>
          <span className="setup-label" id="lifespan-label">
            how long do you hope to live?
          </span>
          <div className="setup-field setup-stepper" role="group" aria-labelledby="lifespan-label">
            <button
              aria-label="fewer years"
              disabled={!!lifespan && lifespan <= MIN_YEARS}
              onClick={() => setLifespan(lifespan ? Math.max(MIN_YEARS, lifespan - 1) : AVERAGE)}
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
                placeholder="choose"
                value={yearsText}
                onFocus={(e) => e.currentTarget.select()}
                onChange={(e) => {
                  const t = e.target.value.replace(/\D/g, '')
                  setYearsText(t)
                  const n = Number(t)
                  if (n >= MIN_YEARS && n <= MAX_YEARS) setLifespanValue(n)
                }}
                onBlur={() => setYearsText(lifespan ? String(lifespan) : '')}
                onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
              />
              {lifespan !== null && <span>years</span>}
            </label>
            <button
              aria-label="more years"
              disabled={!!lifespan && lifespan >= MAX_YEARS}
              onClick={() => setLifespan(lifespan ? Math.min(MAX_YEARS, lifespan + 1) : AVERAGE)}
            >
              +
            </button>
          </div>
          <p className="setup-hint">
            the average in America is about 79 years
            <br />
            76 for men, 81 for women
          </p>
        </div>
      </div>

      <p className="welcome-count" aria-live="polite">
        <span className="welcome-count-n">{c ? fmt(c.total) : '—'}</span>
        <span className="welcome-count-w">squares in your life</span>
        <span className="welcome-count-a">{c ? `and ${fmt(c.left)} still ahead to paint` : ' '}</span>
      </p>

      {error && <p className="setup-error">{error}</p>}
      <div className="welcome-foot">
        <button className="pill" disabled={!valid || busy} onClick={start}>
          {busy ? 'saving…' : 'start painting →'}
        </button>
      </div>
    </section>
  )
}
