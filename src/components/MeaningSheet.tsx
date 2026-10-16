import { PAINTS } from '../lib/paints'
import { Sheet } from './Sheet'

type Props = { open: boolean; onClose: () => void }

export function MeaningSheet({ open, onClose }: Props) {
  return (
    <Sheet open={open} onClose={onClose}>
      <h2 className="sheet-title">Meaningfully</h2>
      <p className="sheet-body">
        Not a good day or a bad one. Not what you got done. A day is meaningful when you were aware of it, and
        spent it on what matters to you.
      </p>
      <ul className="legend">
        {PAINTS.map((p) => (
          <li key={p.id}>
            <span className="legend-swatch" style={{ background: p.hex }} />
            {p.meaning}
          </li>
        ))}
      </ul>
      <button className="pill" onClick={onClose}>
        close
      </button>
    </Sheet>
  )
}
