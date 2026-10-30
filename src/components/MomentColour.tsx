import { PAINTS, WORD, type Paint } from '../lib/paints'

// A moment's own colour, optional: the square holds the day's answer, the moments hold the mix. No verb ("paint" is the
// day's): each choice is its own word with its dot, so a moment simply says what it was. Tap the chosen one to clear.
export function MomentColour({ value, onChange }: { value?: Paint; onChange: (p: Paint | undefined) => void }) {
  return (
    <div className="moment-colour" role="group" aria-label="This moment was">
      {PAINTS.map((p) => (
        <button
          key={p.id}
          className={'moment-colour-pick' + (value === p.id ? ' is-on' : '')}
          // Keep the keyboard up while choosing.
          onPointerDown={(e) => e.preventDefault()}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => onChange(value === p.id ? undefined : p.id)}
          aria-pressed={value === p.id}
        >
          <span className="moment-colour-dot" style={{ background: p.hex }} aria-hidden="true" />
          {WORD[p.id]}
        </button>
      ))}
    </div>
  )
}
