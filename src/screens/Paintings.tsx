import type { Days } from '../lib/days'
import { allPaintings, monthName, inProgress } from '../lib/painting'
import { PaintingThumb } from '../components/PaintingThumb'

type Props = {
  days: Days
  name: string
  onOpen: (period: string) => void
  /** A year's name: its months, in the list. */
  onYear: (year: string) => void
}

/** A painting's caption: "2026", "Oct", or "Oct, so far". */
const caption = (p: string) => (p.length === 4 ? p : monthName(p).slice(0, 3)) + (inProgress(p) ? ', so far' : '')

// paintings (in my days): every month and year you painted, a gallery wall (nomi, Nov 1, 2026: nothing to keep or
// take down; the past is painted). Three to a row, grouped by year, newest first: the year's own painting first, then
// its months, each with a small caption. Tap one to look at it big, and download it once it's finished.
export function Paintings({ days, name, onOpen, onYear }: Props) {
  const all = allPaintings(days)
  const years = [...new Set(all.map((p) => p.slice(0, 4)))].sort().reverse()
  return (
    <main className="settings gallery">
      <h1 className="settings-title">paintings</h1>
      {all.length ? (
        years.map((y) => (
          <section key={y} className="gallery-year">
            {/* The year's name is a link (nomi, Nov 1, 2026: I tried to tap it): its months, in the list. */}
            <h2 className="gallery-year-name">
              <button onClick={() => onYear(y)}>{y}</button>
            </h2>
            <div className="gallery-wall">
              {all
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
        <p className="gallery-empty">Each month and year you paint becomes a painting, and hangs here.</p>
      )}
    </main>
  )
}
