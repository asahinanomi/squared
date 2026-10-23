import type { Days } from '../lib/days'
import { monthName, inProgress } from '../lib/painting'
import { PaintingThumb } from '../components/PaintingThumb'
import { Chevron } from './Today'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { SwipeRow } from '../components/SwipeRow'
import { useState } from 'react'

type Props = {
  kept: string[]
  days: Days
  name: string
  onOpen: (period: string) => void
  onRemove: (period: string) => void
  onBack: () => void
}

// paintings (in my days): the paintings you kept, one to a row, big, newest first. No labels: each is signed.
// Tap one to look at it again; swipe it left to take it down (it can always be kept again).
export function Paintings({ kept, days, name, onOpen, onRemove, onBack }: Props) {
  // Swipe a painting left to take it down, as on what matters; it asks first.
  const [swiped, setSwiped] = useState<string | null>(null)
  const [asking, setAsking] = useState<string | null>(null)
  return (
    <main className="settings gallery">
      <button className="back-btn page-back" onClick={onBack} aria-label={`Back to ${'my days'}`}>
        <Chevron dir="left" />
        {'my days'}
      </button>
      <h1 className="settings-title">paintings</h1>
      {kept.length ? (
        <div className="gallery-wall">
          {kept.map((p) => (
            <SwipeRow
              key={p}
              label="remove"
              open={swiped === p}
              onOpenChange={(o) => setSwiped(o ? p : null)}
              onDelete={() => setAsking(p)}
            >
              <button
                className="gallery-item"
                onClick={() => onOpen(p)}
                aria-label={`${monthName(p)}${p.length === 4 ? '' : ` ${p.slice(0, 4)}`}, ${inProgress(p) ? 'so far' : 'painted'}`}
              >
                <PaintingThumb month={p} days={days} name={name} />
              </button>
            </SwipeRow>
          ))}
        </div>
      ) : (
        <p className="gallery-empty">
          The paintings you keep hang here. Open a month's painting from its picture icon and tap "keep this painting".
        </p>
      )}
      {asking && (
        <ConfirmDialog
          title="Remove this painting?"
          body="It comes off your wall. You can keep it again from its picture icon."
          confirm="remove"
          onConfirm={() => {
            onRemove(asking)
            setAsking(null)
            setSwiped(null)
          }}
          onCancel={() => {
            setAsking(null)
            setSwiped(null)
          }}
        />
      )}
    </main>
  )
}
