import { PAINTS, WORD, type Paint } from '../lib/paints'

// A moment's own colour, optional: the square holds the day's answer, the moments hold the mix. No verb ("paint" is the
// day's), and no dots (a dot is a day): one thin strip in three parts, each with its word under it, so a moment simply
// says what it was. The chosen part thickens and the others fade; tap it again to clear (nomi, Oct 30, 2026).
export function MomentColour({ value, onChange }: { value?: Paint; onChange: (p: Paint | undefined) => void }) {
  return (
    <div className={'moment-colour' + (value ? ' has-pick' : '')} role="group" aria-label="This moment was">
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
          <span className="moment-colour-bar" style={{ background: p.hex }} aria-hidden="true" />
          {WORD[p.id]}
        </button>
      ))}
    </div>
  )
}
