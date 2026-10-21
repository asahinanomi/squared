import type { Days } from '../lib/days'
import { monthName, inProgress } from '../lib/painting'
import { PaintingThumb } from '../components/PaintingThumb'
import { Chevron } from './Today'

type Props = { kept: string[]; days: Days; name: string; onOpen: (period: string) => void; onBack: () => void }

// my paintings (in settings): the paintings you kept, one to a row, big, newest first. No labels: each is signed.
// Tap one to look at it again and keep it again.
export function Paintings({ kept, days, name, onOpen, onBack }: Props) {
  return (
    <main className="settings gallery">
      <button className="setup-back" aria-label="Back" onClick={onBack}>
        <Chevron dir="left" />
      </button>
      <h1 className="settings-title">my paintings</h1>
      {kept.length ? (
        <div className="gallery-wall">
          {kept.map((p) => (
            <button
              key={p}
              className="gallery-item"
              onClick={() => onOpen(p)}
              aria-label={`${monthName(p)}${p.length === 4 ? '' : ` ${p.slice(0, 4)}`}, ${inProgress(p) ? 'so far' : 'painted'}`}
            >
              <PaintingThumb month={p} days={days} name={name} />
            </button>
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
