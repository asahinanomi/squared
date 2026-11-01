import { useEffect } from 'react'
import { todayIso } from '../lib/dates'
import type { Days } from '../lib/days'
import type { Notes } from '../lib/notes'
import { DayCard } from './DaysList'

type Props = {
  days: Days
  notes: Notes
  /** Notes load a month at a time: each framed day's month. */
  loadNotes: (iso: string) => void
  onDay: (iso: string) => void
}

// framed days (in my days): the days you framed, any colour, newest first (squared is about now, so the latest is
// always on top; nomi, Nov 1, 2026), grouped by year under its name, laid out as the list filtered to "framed" (its own
// day cards and headings, so the two never drift apart). Tap one to open the day.
export function Framed({ days, notes, loadNotes, onDay }: Props) {
  const framed = Object.keys(days)
    .filter((iso) => days[iso].framed)
    .sort()
    .reverse()
  const years = [...new Set(framed.map((iso) => iso.slice(0, 4)))]
  useEffect(() => framed.forEach(loadNotes), [framed.join()]) // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <main className="settings framed">
      <h1 className="settings-title">framed days</h1>
      {framed.length ? (
        years.map((y) => (
          <section key={y} className="days-month is-cards">
            <div className="ladder-label month-label">{y}</div>
            <ol className="month-list day-cards">
              {framed
                .filter((iso) => iso.startsWith(y))
                .map((iso) => (
                  <li key={iso}>
                    <DayCard iso={iso} day={days[iso]} notes={notes[iso]} today={todayIso()} onPick={onDay} />
                  </li>
                ))}
            </ol>
          </section>
        ))
      ) : (
        <p className="gallery-empty">
          The days you frame hang here, the ones you want to keep. Under a painted day, tap "more", then "frame it".
        </p>
      )}
    </main>
  )
}
