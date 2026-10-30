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

// framed days (in my days): the days you framed, any colour, oldest first, like the chapters of a life. Each is the
// list's own day card (one card, so the two never drift apart), in its frame, its year with the date, "to remember"
// over the note. Tap one to open the day. Lab: https://claude.ai/artifact/8RNH3LHkF4RtJ3QchG5fkm (row 8)
export function Framed({ days, notes, loadNotes, onDay }: Props) {
  const framed = Object.keys(days)
    .filter((iso) => days[iso].framed)
    .sort()
  useEffect(() => framed.forEach(loadNotes), [framed.join()]) // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <main className="settings framed">
      <h1 className="settings-title">framed days</h1>
      {framed.length ? (
        <ol className="month-list day-cards">
          {framed.map((iso) => (
            <li key={iso}>
              <DayCard iso={iso} day={days[iso]} notes={notes[iso]} today={todayIso()} onPick={onDay} />
            </li>
          ))}
        </ol>
      ) : (
        <p className="gallery-empty">
          The days you frame hang here, the ones you want to keep. Under a painted day, tap "more", then "frame it".
        </p>
      )}
    </main>
  )
}
