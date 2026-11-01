import { useState } from 'react'
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
// take down; the past is painted). Two tabs, as the list's (nomi: the wall grows long): years, every year's painting
// three to a row; months, grouped under each year's name (a link to its months in the list), newest first. Each with
// a small caption; tap one to look at it big, and download it once it's finished. The tab is remembered here.
const TAB = 'squared.paintingsTab'
export function Paintings({ days, name, onOpen, onYear }: Props) {
  const [tab, setTab] = useState<'years' | 'months'>(() => {
    try {
      return localStorage.getItem(TAB) === 'years' ? 'years' : 'months'
    } catch {
      return 'months'
    }
  })
  const pick = (t: 'years' | 'months') => {
    setTab(t)
    try {
      localStorage.setItem(TAB, t)
    } catch {
      /* fine without it */
    }
  }
  const all = allPaintings(days)
  const years = all.filter((p) => p.length === 4)
  const item = (p: string) => (
    <button
      key={p}
      className="gallery-item"
      onClick={() => onOpen(p)}
      aria-label={`${monthName(p)}${p.length === 4 ? '' : ` ${p.slice(0, 4)}`}, ${inProgress(p) ? 'so far' : 'painted'}`}
    >
      <PaintingThumb month={p} days={days} name={name} />
      <span>{caption(p)}</span>
    </button>
  )
  return (
    <main className="settings gallery">
      <h1 className="settings-title">paintings</h1>
      {all.length ? (
        <>
          <div className="seg" role="group" aria-label="Paintings of">
            {(['years', 'months'] as const).map((t) => (
              <button
                key={t}
                className={t === tab ? 'is-on' : undefined}
                aria-pressed={t === tab}
                onClick={() => pick(t)}
              >
                {t}
              </button>
            ))}
          </div>
          {tab === 'years' ? (
            <div className="gallery-wall gallery-years">{years.map(item)}</div>
          ) : (
            years.map((y) => (
              <section key={y} className="gallery-year">
                {/* The year's name is a link (nomi, Nov 1, 2026: I tried to tap it): its months, in the list. */}
                <h2 className="gallery-year-name">
                  <button onClick={() => onYear(y)}>{y}</button>
                </h2>
                <div className="gallery-wall">{all.filter((p) => p.length > 4 && p.startsWith(y)).map(item)}</div>
              </section>
            ))
          )}
        </>
      ) : (
        <p className="gallery-empty">Each month and year you paint becomes a painting, and hangs here.</p>
      )}
    </main>
  )
}
