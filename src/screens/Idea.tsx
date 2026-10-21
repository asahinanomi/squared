import { paintHex, type Paint } from '../lib/paints'
import { Chevron } from './Today'

const COLOURS: [Paint, string][] = [
  ['green', 'yes, I spent it on what matters.'],
  ['red', 'no, I was busy, but none of it mattered.'],
  ['grey', 'I don’t know… I wasn’t paying attention.'],
]

type Props = {
  /** Signed in: the soft link on to what matters. */
  onMatters?: () => void
  /** Opened from the sign-in screen: the way back to it. */
  onBack?: () => void
  /** Signed in: a quiet link on to "help build squared". */
  onSupport?: () => void
  /** Signed in: "get in touch", the one way to reach the maker. */
  onFeedback?: () => void
  /** Signed in: the small print, in the page's footer. */
  onLegal?: (page: 'questions' | 'privacy' | 'terms') => void
}

// "the idea": why squared exists, in the maker's own words.
export function Idea({ onMatters, onBack, onSupport, onFeedback, onLegal }: Props) {
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
        I live a very busy life. one day, I looked up and saw so many days had gone that I couldn’t say where or how.
        scary.
      </p>
      <p>
        the hard part wasn’t the bad days. it was the busy, even productive days I spent on things that didn’t matter;
        or even worse — days slipped by that I didn’t even notice.
      </p>
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
        paint one square a day. no streaks, no scores — just an honest log, one day at a time. the days that build a
        life, the days we have fewer than we think.
      </p>
      <p>I’ll try to make mine as green as I can. I hope squared helps you too.</p>
      <p className="idea-sign">— nomi</p>
      {/* The page's one action, after the letter: a keyline pill (secondary), gentle on a quiet page. */}
      {onMatters && (
        <button className="idea-go" onClick={onMatters}>
          start by naming what matters to you →
        </button>
      )}
      {/* squared's about page: the ways to reach and help, then the small print. */}
      {onSupport && onFeedback && (
        <p className="idea-support">
          <button onClick={onSupport}>help build squared</button>
          <span aria-hidden="true">·</span>
          <button onClick={onFeedback}>get in touch</button>
        </p>
      )}
      {onLegal && (
        <footer className="idea-foot">
          <button onClick={() => onLegal('questions')}>questions</button>
          <span aria-hidden="true">·</span>
          <button onClick={() => onLegal('privacy')}>privacy</button>
          <span aria-hidden="true">·</span>
          <button onClick={() => onLegal('terms')}>terms</button>
        </footer>
      )}
    </main>
  )
}
