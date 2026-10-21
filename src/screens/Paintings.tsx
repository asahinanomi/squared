import type { Days } from '../lib/days'
import { monthTitle } from '../lib/dates'
import { inProgress } from '../lib/painting'
import { PaintingThumb } from '../components/PaintingThumb'

type Props = { days: Days; name: string; onOpen: (month: string) => void }

// my paintings: every month you've painted, hung framed on one wall, newest first (this month "so far").
// Tap one to look at it and keep it. Centred: it's a page you look at.
export function Paintings({ days, name, onOpen }: Props) {
  const months = [...new Set(Object.keys(days).map((iso) => iso.slice(0, 7)))].sort().reverse()
  return (
    <main className="gallery">
      <h1 className="settings-title gallery-title">my paintings</h1>
      {months.length ? (
        <div className="gallery-wall">
          {months.map((m) => (
            <button key={m} className="gallery-item" onClick={() => onOpen(m)}>
              <PaintingThumb month={m} days={days} name={name} />
              <span>
                {monthTitle(`${m}-01`)}
                {inProgress(m) && <small> · so far</small>}
              </span>
            </button>
          ))}
        </div>
      ) : (
        <p className="gallery-empty">Every month you paint becomes a painting. Your first one hangs here.</p>
      )}
    </main>
  )
}
