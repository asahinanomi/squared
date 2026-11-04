import { PAINTS } from '../lib/paints'
import { Sheet } from './Sheet'

type Props = { open: boolean; onClose: () => void }

export function MeaningSheet({ open, onClose }: Props) {
  return (
    <Sheet open={open} onClose={onClose} className="is-legend">
      {/* The same quiet style as the other help sheets; a tap outside or a swipe down closes it. A question, answered by
          its first line (nomi, Oct 31, 2026: it was the bare word "meaningful"). */}
      <h2 className="torn-title">What makes a day meaningful?</h2>
      {/* Shorter (nomi, Nov 4, 2026): the same idea, in two lines. */}
      <p className="sheet-body meaning-body">Not a good day or a bad one. A day spent on what matters to you.</p>
      <ul className="legend meaning-legend">
        {PAINTS.map((p) => (
          <li key={p.id}>
            <span className="legend-swatch" style={{ background: p.hex }} />
            {p.meaning}
          </li>
        ))}
      </ul>
    </Sheet>
  )
}
