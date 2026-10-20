import { useEffect, useRef, useState } from 'react'
import { MAX_CHARS, newEntry, pushMatters, saveMatters, type Kind } from '../lib/matters'
import { paintHex } from '../lib/paints'
import { Chevron } from './Today'

type Props = {
  /** Off to today's square (onboarding is over, whichever way it ended). */
  onDone: () => void
}

const KEY = 'squared.welcomed'

/** Whether this device has already walked someone through the first pause (or they skipped it). */
export function welcomed(): boolean {
  try {
    return localStorage.getItem(KEY) === 'yes'
  } catch {
    return false
  }
}

export function markWelcomed() {
  try {
    localStorage.setItem(KEY, 'yes')
  } catch {
    /* private mode: it may ask again next visit, only while nothing is painted or written */
  }
}

const FIELDS: Record<Kind, { dot: string; holders: string[] }> = {
  meaningful: { dot: paintHex('green'), holders: ['time with family', 'a long walk', 'making something'] },
  wasted: { dot: paintHex('red'), holders: ['scrolling', 'busywork', 'just waiting'] },
}

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

// Onboarding, shown once to someone new (nothing painted, nothing written yet): a pause before the
// first square to name what a meaningful day and an empty one look like. The lines go straight into
// settings → what matters; skipping leaves it empty, to fill in later.
export function Welcome({ onDone }: Props) {
  const [step, setStep] = useState(0)
  const [meaningful, setMeaningful] = useState(['', '', ''])
  const [wasted, setWasted] = useState(['', '', ''])
  const m = lines(meaningful)
  const e = lines(wasted)

  // Reaching the end keeps what was written (the same lists as settings → what matters).
  const finish = (mine: string[], empty: string[]) => {
    if (mine.length) {
      const saved = saveMatters({
        meaningful: mine.map((text) => ({ ...newEntry(), text })),
        wasted: empty.map((text) => ({ ...newEntry(), text })),
      })
      pushMatters(saved).catch((err) => console.error('Could not save what matters', err))
    }
    setStep(3)
  }
  const done = () => {
    markWelcomed()
    onDone()
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
        <section className="welcome-step is-pause" key="pause" aria-label="Step 1 of 4">
          <p className="welcome-eyebrow">before your first square, take a minute.</p>
          <h1 className="welcome-q">
            what does a <u>meaningful</u> day look like for you?
          </h1>
          <div className="welcome-foot">
            <button className="pill" onClick={() => setStep(1)}>
              let's think
            </button>
            <button className="welcome-link" onClick={() => finish([], [])}>
              skip for now
            </button>
          </div>
        </section>
      ) : step === 1 ? (
        <section className="welcome-step" key="meaningful" aria-label="Step 2 of 4">
          {back(0)}
          <h1 className="welcome-q">
            what makes a day feel <u>meaningful</u>?
          </h1>
          <p className="welcome-sub">a few words each. One is fine.</p>
          <Lines
            kind="meaningful"
            values={meaningful}
            onChange={setMeaningful}
            onEnter={() => m.length && setStep(2)}
          />
          <div className="welcome-foot">
            {/* At least one line: it's the compass. */}
            <button className="pill" disabled={!m.length} onClick={() => setStep(2)}>
              next
            </button>
          </div>
        </section>
      ) : step === 2 ? (
        <section className="welcome-step" key="empty" aria-label="Step 3 of 4">
          {back(1)}
          <h1 className="welcome-q">
            and what makes a day feel <u>empty</u>?
          </h1>
          <p className="welcome-sub">the busy days that don't add up to much.</p>
          <Lines kind="wasted" values={wasted} onChange={setWasted} onEnter={() => finish(m, e)} />
          <div className="welcome-foot">
            <button className="pill" onClick={() => finish(m, e)}>
              next
            </button>
            <button
              className="welcome-link"
              onClick={() => {
                setWasted(['', '', ''])
                finish(m, [])
              }}
            >
              skip this one
            </button>
          </div>
        </section>
      ) : (
        <section className="welcome-step" key="ready" aria-label="Step 4 of 4">
          <h1 className="welcome-q">{m.length ? 'great start!' : 'no rush.'}</h1>
          <p className="welcome-where">you can always add more later in settings → what&nbsp;matters</p>
          {m.length > 0 && (
            <div className="welcome-compass">
              {(
                [
                  ['mattered', 'meaningful', m],
                  ['empty', 'wasted', e],
                ] as const
              )
                .filter(([, , l]) => l.length)
                .map(([label, kind, l]) => (
                  <div key={kind}>
                    <h2>
                      <span className="welcome-dot" style={{ background: FIELDS[kind].dot }} aria-hidden="true" />
                      {label}
                    </h2>
                    <ul>
                      {l.map((t, i) => (
                        <li key={i}>{t}</li>
                      ))}
                    </ul>
                  </div>
                ))}
            </div>
          )}
          <div className="welcome-foot">
            <button className="pill" onClick={done}>
              paint today →
            </button>
          </div>
        </section>
      )}
    </main>
  )
}
