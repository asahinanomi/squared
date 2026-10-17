import { paintHex, type Paint } from '../lib/paints'

const COLOURS: [Paint, string][] = [
  ['green', 'here, and it mattered.'],
  ['red', 'here, but wasted.'],
  ['grey', 'gone before i noticed.'],
]

// "the idea": why squared exists, in the maker's own words.
export function Idea() {
  return (
    <main className="idea">
      <h1 className="idea-title">the idea</h1>
      <p>
        i live a very busy life. one day i looked up and saw how much of it had quietly slipped past - and i couldn’t
        even say where it went :(
      </p>
      <p>i made squared to help me stay aware. each day, you paint one square — one colour, for how you lived it.</p>
      <ul className="idea-colours">
        {COLOURS.map(([paint, line]) => (
          <li key={paint}>
            {/* The same dot as under the palette on the day screen. */}
            <span className="whisper-dot" style={{ background: paintHex(paint) }} aria-hidden="true" />
            {paint} - {line}
          </li>
        ))}
      </ul>
      <p>
        no streaks. no scores. just an honest log, one day at a time - the days that build a life, the days we have
        fewer than we think.
      </p>
      <p>i hope to make mine as green as i can. i hope squared can help you too.</p>
      <p className="idea-sign">— nomi</p>
    </main>
  )
}
