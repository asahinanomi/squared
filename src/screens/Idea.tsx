import { paintHex, type Paint } from '../lib/paints'
import { Chevron } from './Today'

const COLOURS: [Paint, string][] = [
  ['green', 'yes, I spent it on what matters.'],
  ['red', 'no, I wish I’d spent it differently.'],
  ['grey', 'I don’t know… I wasn’t paying attention.'],
]

type Props = {
  /** Signed in: the soft link on to what matters. */
  onMatters?: () => void
  /** Opened from the sign-in screen: the way back to it. */
  onBack?: () => void
}

// "why squared" (the letter): why squared exists, in the maker's own words. Rewritten by nomi, Oct 23, 2026, on
// the brand story: meaningful, not good; less regret; noticing without blame.
export function Idea({ onMatters, onBack }: Props) {
  return (
    <main className="idea">
      {onBack && (
        <button className="back-btn idea-back" onClick={onBack} aria-label="Back to sign in">
          <Chevron dir="left" />
          sign in
        </button>
      )}
      <h1 className="idea-title">why squared</h1>
      <p>
        I had my head down in a busy life. one day, I looked up and saw so many days had gone. scarily fast, faster than
        I thought I had.
      </p>
      <p>
        the hard part wasn’t the bad days. some of my hardest days were the ones truly worth it, the days I really grew.
        the worst were the days I wish I had lived differently: the days I could have spent on what truly matters, and
        the days that slipped by without me noticing.
      </p>
      <p>I don’t want to reach the end and find a life full of regret and blur.</p>
      <p>squared asks one thing each day:</p>
      <p>did I spend Today meaningfully?</p>
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
        paint one square a day. no streaks, no scores. just a moment to reflect, one day at a time. a day of regret
        isn’t there to blame you. noticing it is how the next one goes differently.
      </p>
      <p>I’ll try to make mine meaningful, with as little regret as I can. I hope squared helps you do the same.</p>
      <p className="idea-sign">— nomi</p>
      {/* The way on, as a letter would end: a quiet p.s. under the signature. */}
      {onMatters && (
        <p className="idea-ps">
          p.s.{' '}
          <button className="idea-inline" onClick={onMatters}>
            start by naming what matters to you →
          </button>
        </p>
      )}
    </main>
  )
}
