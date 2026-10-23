import { useEffect } from 'react'
import { fromIso, plainDate } from '../lib/dates'
import type { Days } from '../lib/days'
import type { Notes } from '../lib/notes'
import { frameVars, paintHex } from '../lib/paints'
import { Chevron } from './Today'

type Props = {
  days: Days
  notes: Notes
  /** Notes load a month at a time: each framed day's month. */
  loadNotes: (iso: string) => void
  onDay: (iso: string) => void
  onBack: () => void
}

// my framed days: the days you framed, any colour, oldest first, like the chapters of a life. Only what matters on
// each card: its framed square, the date and weekday, and up to three lines of what you wanted to remember.
// Tap one to open the day. Lab: https://claude.ai/artifact/Ttid43gnYW9XzNRibK5QVc (G, without the age)
export function Framed({ days, notes, loadNotes, onDay, onBack }: Props) {
  const framed = Object.keys(days)
    .filter((iso) => days[iso].framed)
    .sort()
  useEffect(() => framed.forEach(loadNotes), [framed.join()]) // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <main className="settings framed">
      <button className="setup-back" aria-label="Back" onClick={onBack}>
        <Chevron dir="left" />
      </button>
      <h1 className="settings-title">my framed days</h1>
      {framed.length ? (
        <ol className="framed-list">
          {framed.map((iso) => {
            const day = days[iso]
            const list = notes[iso] ?? []
            const note = list.find((n) => n.pinned) ?? list.at(-1)
            return (
              <li key={iso}>
                <button className="framed-day" onClick={() => onDay(iso)} style={frameVars(day.color)}>
                  <span className="framed-square" style={{ background: paintHex(day.color) }} aria-hidden="true" />
                  <span className="framed-text">
                    <span className="framed-date">
                      {plainDate(iso)} <small>· {fromIso(iso).toLocaleDateString('en-US', { weekday: 'short' })}</small>
                    </span>
                    {note && <span className="framed-note">{note.body}</span>}
                  </span>
                </button>
              </li>
            )
          })}
        </ol>
      ) : (
        <p className="gallery-empty">
          The days you frame hang here, the ones you want to keep. Under a painted day, tap "frame this day".
        </p>
      )}
    </main>
  )
}
