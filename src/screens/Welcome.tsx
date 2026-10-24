import { useEffect, useRef, useState, type ReactNode } from 'react'
import { fromIso, todayIso } from '../lib/dates'
import { lifeCounts } from '../lib/life'
import { MAX_CHARS, newEntry, type Kind, type Matters } from '../lib/matters'
import { PAINTS, paintHex } from '../lib/paints'
import type { Profile } from '../lib/profile'
import { reportError } from '../lib/report'
import { Privacy } from './Privacy'
import { Terms } from './Terms'
import { Chevron } from './Today'

type Props = {
  /** Opened with ?welcome to try it: nothing is saved. */
  tryOut?: boolean
  /** Saves how many squares (birth date and lifespan); rejects if it couldn't be saved. */
  onSquares: (p: Profile) => Promise<void>
  /** Off to today's square: onboarding is over. */
  onDone: () => void
  /** The lines written here, for what matters (saved to the account). */
  onMatters: (m: Matters) => void
}

const FIELDS: Record<Kind, { dot: string; holders: string[] }> = {
  meaningful: { dot: paintHex('green'), holders: ['time with family', 'a long walk', 'making something'] },
  wasted: { dot: paintHex('red'), holders: ['scrolling', 'busywork', 'just waiting'] },
}
// Step 1 explains the colours as kinds of day, named (the dot alone doesn't say which colour the sentence means);
// the palette's lines answer the question, so they wait for the day screen.
const KIND: Record<'green' | 'red' | 'grey', ReactNode> = {
  green: (
    <>
      a day <b>worth it</b>: I spent it on what matters.
    </>
  ),
  red: (
    <>
      a day of <b>regret</b>: I wish I’d spent it differently.
    </>
  ),
  grey: (
    <>
      <b>a blur</b>: I wasn’t paying attention.
    </>
  ),
}
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
// what makes one empty (both skippable; the lines go straight into my days → what matters), then how many
// squares you have (never filled in for you, never skipped, 18 and over), and "start painting" opens today's
// first square. Lab: https://claude.ai/artifact/TdNFeCnenYybjepoDhUt9C
export function Welcome({ tryOut, onSquares, onDone, onMatters }: Props) {
  const [step, setStep] = useState(0)
  const [meaningful, setMeaningful] = useState(['', '', ''])
  const [wasted, setWasted] = useState(['', '', ''])
  const m = lines(meaningful)
  const e = lines(wasted)

  // On to the last step, keeping what was written (the same lists as my days → what matters).
  const toSquares = (mine: string[], empty: string[]) => {
    if ((mine.length || empty.length) && !tryOut) {
      onMatters({
        meaningful: mine.map((text) => ({ ...newEntry(), text })),
        wasted: empty.map((text) => ({ ...newEntry(), text })),
      })
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
          {/* What a square is and what its colour means (the three lines, as under the palette); then a question
              that looks forward, about now. */}
          <h2 className="welcome-hello">Welcome to squared.</h2>
          <p className="welcome-intro">
            Each square represents one day of your life.
            <br />
            Its colour is how you spent it:
          </p>
          <ul className="welcome-colours">
            {PAINTS.map((p) => (
              <li key={p.id}>
                <i style={{ background: p.hex }} aria-hidden="true" />
                <span>
                  {p.id} · {KIND[p.id]}
                </span>
              </li>
            ))}
          </ul>
          <h1 className="welcome-big">how would you like to spend your days?</h1>
          <div className="welcome-foot">
            <button className="pill" onClick={() => setStep(1)}>
              start now
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
  // The small print, read right here over the step (its back returns to it), so nothing typed is lost.
  const [reading, setReading] = useState<'terms' | 'privacy' | null>(null)
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
      <h1 className="welcome-q">how many squares will you paint?</h1>

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
            the average lifespan in America is about 79 years
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
        {/* Starting is agreeing: no checkbox. The links open the small print over this step, back returns here. */}
        <p className="welcome-agree">
          by starting, you confirm you’re 18 or over and agree to the{' '}
          <button className="welcome-agree-link" onClick={() => setReading('terms')}>
            terms
          </button>{' '}
          and{' '}
          <button className="welcome-agree-link" onClick={() => setReading('privacy')}>
            privacy
          </button>
          .
        </p>
      </div>
      {reading && (
        <div className="welcome-read">
          {reading === 'terms' ? (
            <Terms onBack={() => setReading(null)} backLabel="back" asSheet />
          ) : (
            <Privacy onBack={() => setReading(null)} backLabel="back" asSheet />
          )}
        </div>
      )}
    </section>
  )
}
