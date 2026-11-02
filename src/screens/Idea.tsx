import { paintHex, type Paint } from '../lib/paints'
import { Chevron } from './Today'

const COLOURS: [Paint, string][] = [
  ['green', 'yes, I spent it on what matters.'],
  ['red', 'no, I wish I’d spent it differently.'],
  ['grey', 'I don’t know… I wasn’t paying attention.'],
]

type Props = {
  /** The letter's p.s., "begin with today": to sign in (signed out) or to today (signed in). */
  onBegin: () => void
  /** Opened from the sign-in screen: the way back to it. */
  onBack?: () => void
}

// "the idea" (the letter): why squared exists, in the maker's own words. Rewritten by nomi, Oct 23, 2026, on the brand
// story; made shorter, all why, Nov 2, 2026 (the how lives in the faq): the lost days, the question and its colours,
// the zoom out, noticing without blame, the line. Its p.s. begins where squared does: today.
export function Idea({ onBegin, onBack }: Props) {
  return (
    <main className="idea">
      {onBack && (
        <button className="back-btn idea-back" onClick={onBack} aria-label="Back to sign in">
          <Chevron dir="left" />
          sign in
        </button>
      )}
      <h1 className="idea-title">the idea</h1>
      <p>for years I kept my head down, busy. one day I looked up, and so many days were gone.</p>
      <p>
        the hardest days weren’t the worst. some were truly worth it; they’re where I grew. the worst were the days I
        wish I’d lived differently, or barely remember.
      </p>
      <p>so I made squared to ask myself one question each day:</p>
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
      <p>then I zoom out, and today is one small square among all the days I’ll have.</p>
      <p>no streaks, no scores. just a moment to be here and now. noticing a red day is how the next one changes ;)</p>
      <p>the past is painted. today is still yours.</p>
      <p className="idea-sign">— nomi</p>
      {/* The way on. Signed out (a stranger, often from a shared link): the page's one black pill, the moment the letter
          has moved them (nomi, Nov 2, 2026). Signed in: a quiet p.s., as a letter would end. */}
      {onBack ? (
        <button className="pill idea-begin" onClick={onBegin}>
          begin with today
        </button>
      ) : (
        <p className="idea-ps">
          p.s.{' '}
          <button className="idea-inline" onClick={onBegin}>
            begin with today →
          </button>
        </p>
      )}
    </main>
  )
}
