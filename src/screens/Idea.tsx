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

// "the idea" (the letter): why squared exists, in the maker's own words. Rewritten by nomi, Oct 23, 2026, on
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
      <h1 className="idea-title">the idea</h1>
      <p>
        for years I kept my head down, busy. one day I looked up, and so many days were gone. faster than I ever
        thought.
      </p>
      <p>
        the hard part wasn’t the bad days. some of my hardest days were the ones truly worth it, the days I really grew.
        the worst were the days I wish I’d lived differently, or barely remember.
      </p>
      <p>I created squared to ask myself one question each day:</p>
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
        paint one square a day. no streaks, no scores. just a moment to be here and now. and noticing a regret day is
        how the next one could go differently ;)
      </p>
      <p>
        some days are both, worth it and regret at once. I paint what won, and keep the rest in a moment, in its own
        colour.
      </p>
      <p>I’ll try to paint as many green squares as I can.</p>
      <p>the past is painted. today is still yours.</p>
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
