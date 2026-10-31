import { noteColorsOn } from '../lib/notes'
import { PAINTS, WORD, type Paint } from '../lib/paints'

// A moment's own colour, optional: the square holds the day's answer, the moments hold the mix. No verb ("paint" is the
// day's), and no dots (a dot is a day): one thin strip in two parts, each with its word under it, so a moment simply
// says what it was. Only worth it and regret: a moment is noticing, so "a blur" (I wasn't paying attention) never fits
// one; grey stays the day's. The chosen part thickens and the other fades; its word gets a ✕, and tapping it again
// clears (nomi, Oct 30, 2026).
const SIDES = PAINTS.filter((p) => p.id !== 'grey')

type Props = {
  value?: Paint
  onChange: (p: Paint | undefined) => void
  /** Choosing adds the moment (the box at the top of the day): no ✕, and the other side greys out for the pause. */
  adds?: boolean
}

export function MomentColour({ value, onChange, adds }: Props) {
  // Colours can't be saved (the database is missing its column): no strip, rather than a pick that vanishes.
  if (!noteColorsOn()) return null
  return (
    <div
      className={'moment-colour' + (value ? ' has-pick' : '') + (adds ? ' is-adding' : '')}
      role="group"
      aria-label="This moment was"
    >
      {SIDES.map((p) => (
        <button
          key={p.id}
          className={'moment-colour-pick' + (value === p.id ? ' is-on' : '')}
          // Keep the keyboard up while choosing.
          onPointerDown={(e) => e.preventDefault()}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => onChange(value === p.id ? undefined : p.id)}
          aria-pressed={value === p.id}
          aria-label={value === p.id ? `${WORD[p.id]}, tap to clear` : WORD[p.id]}
        >
          <span
            className="moment-colour-bar"
            style={{ background: p.hex, '--paint': p.hex } as React.CSSProperties}
            aria-hidden="true"
          />
          <span>
            {WORD[p.id]}
            {value === p.id && !adds && (
              <span className="moment-colour-clear" aria-hidden="true">
                {' '}
                ✕
              </span>
            )}
          </span>
        </button>
      ))}
    </div>
  )
}
