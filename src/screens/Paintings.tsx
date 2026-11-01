import type { Days } from '../lib/days'
import { monthName, inProgress } from '../lib/painting'
import { PaintingThumb } from '../components/PaintingThumb'

type Props = {
  kept: string[]
  days: Days
  name: string
  onOpen: (period: string) => void
}

/** A painting's caption: "2026", "Oct", or "Oct, so far". */
const caption = (p: string) => (p.length === 4 ? p : monthName(p).slice(0, 3)) + (inProgress(p) ? ', so far' : '')

// paintings (in my days): the paintings you kept, a gallery wall (nomi, Nov 1, 2026: one to a row was a scroll of
// posters, bigger than the painting's own view). Three to a row, grouped by year, newest first: the year's own painting
// first, then its months, each with a small caption. Tap one to look at it big (its label, download, and take it down).
export function Paintings({ kept, days, name, onOpen }: Props) {
  const years = [...new Set(kept.map((p) => p.slice(0, 4)))].sort().reverse()
  return (
    <main className="settings gallery">
      <h1 className="settings-title">paintings</h1>
      {kept.length ? (
        years.map((y) => (
          <section key={y} className="gallery-year">
            <h2 className="gallery-year-name">{y}</h2>
            <div className="gallery-wall">
              {kept
                .filter((p) => p.startsWith(y))
                .sort((a, b) => (a.length !== b.length ? a.length - b.length : b.localeCompare(a)))
                .map((p) => (
                  <button
                    key={p}
                    className="gallery-item"
                    onClick={() => onOpen(p)}
                    aria-label={`${monthName(p)}${p.length === 4 ? '' : ` ${p.slice(0, 4)}`}, ${inProgress(p) ? 'so far' : 'painted'}`}
                  >
                    <PaintingThumb month={p} days={days} name={name} />
                    <span>{caption(p)}</span>
                  </button>
                ))}
            </div>
          </section>
        ))
      ) : (
        <p className="gallery-empty">
          The paintings you keep hang here. Open a month's painting from its picture icon and tap "keep this painting".
        </p>
      )}
    </main>
  )
}
