import type { Days } from '../lib/days'
import { monthName, inProgress } from '../lib/painting'
import { PaintingThumb } from '../components/PaintingThumb'
import { Chevron } from './Today'

type Props = {
  kept: string[]
  days: Days
  name: string
  onOpen: (period: string) => void
  onRemove: (period: string) => void
  onBack: () => void
}

// my paintings (in settings): the paintings you kept, one to a row, big, newest first. No labels: each is signed.
// Tap one to look at it again; "remove" takes it down (it can always be kept again).
export function Paintings({ kept, days, name, onOpen, onRemove, onBack }: Props) {
  return (
    <main className="settings gallery">
      <button className="setup-back" aria-label="Back" onClick={onBack}>
        <Chevron dir="left" />
      </button>
      <h1 className="settings-title">my paintings</h1>
      {kept.length ? (
        <div className="gallery-wall">
          {kept.map((p) => (
            <figure key={p} className="gallery-piece">
              <button
                className="gallery-item"
                onClick={() => onOpen(p)}
                aria-label={`${monthName(p)}${p.length === 4 ? '' : ` ${p.slice(0, 4)}`}, ${inProgress(p) ? 'so far' : 'painted'}`}
              >
                <PaintingThumb month={p} days={days} name={name} />
              </button>
              <button className="gallery-remove" onClick={() => onRemove(p)}>
                remove
              </button>
            </figure>
          ))}
        </div>
      ) : (
        <p className="gallery-empty">
          The paintings you keep hang here. Open a month's painting from its picture icon and tap "keep this painting".
        </p>
      )}
    </main>
  )
}
