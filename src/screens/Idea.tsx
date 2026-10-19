import { paintHex, type Paint } from '../lib/paints'
import { Chevron } from './Today'

const COLOURS: [Paint, string][] = [
  ['green', 'mattered — yes, I spent it on what matters.'],
  ['red', 'empty — no, I was busy, but none of it mattered.'],
  ['grey', 'slipped — I don’t know, I wasn’t paying attention.'],
]

type Props = {
  /** Signed in: the soft link on to what matters. */
  onMatters?: () => void
  /** Opened from the sign-in screen: the way back to it. */
  onBack?: () => void
}

// "the idea": why squared exists, in the maker's own words.
export function Idea({ onMatters, onBack }: Props) {
  return (
    <main className="idea">
      {onBack && (
        <button className="back-btn idea-back" onClick={onBack} aria-label="Back to sign in">
          <Chevron dir="left" />
          sign in
        </button>
      )}
      <h1 className="idea-title">the idea</h1>
      <p>
        I live a very busy life. one day, I looked up and saw so many days had slipped past that I couldn’t say where or
        how they went.
      </p>
      <p>
        the hard part wasn’t the bad days. it was the busy ones, the lost ones — the full, productive days I spent on
        things that didn’t matter, or days so busy I didn’t even notice them go.
      </p>
      <p>squared asks one thing each day: did I spend Today meaningfully?</p>
      <ul className="idea-colours">
        {COLOURS.map(([paint, line]) => (
          <li key={paint}>
            {/* The same dot as under the palette on the day screen. */}
            <span className="whisper-dot" style={{ background: paintHex(paint) }} aria-hidden="true" />
            {line}
          </li>
        ))}
      </ul>
      <p>
        paint one square a day. no streaks, no scores — just an honest log, one day at a time. the days that build a
        life, the days we have fewer than we think.
      </p>
      <p>I’ll try to make mine as green as I can. I hope squared helps you too.</p>
      {/* A very soft invitation, not a button. */}
      {onMatters && (
        <p className="idea-nudge">
          <button onClick={onMatters}>(start by naming what matters to you →)</button>
        </p>
      )}
      <p className="idea-sign">— nomi</p>
    </main>
  )
}
