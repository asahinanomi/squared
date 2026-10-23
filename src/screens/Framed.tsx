import { useEffect } from 'react'
import { ageOn, plainDate } from '../lib/dates'
import type { Days } from '../lib/days'
import type { Notes } from '../lib/notes'
import { frameVars, squareFill } from '../lib/paints'
import { Chevron } from './Today'

type Props = {
  days: Days
  notes: Notes
  born?: string
  /** Notes load a month at a time: each framed day's month. */
  loadNotes: (iso: string) => void
  onDay: (iso: string) => void
  onBack: () => void
}

// my framed days: the days you framed, any colour, oldest first, like the chapters of a life. Each is its small
// framed square, the date, how old you were, and what you wanted to remember. Tap one to open the day.
export function Framed({ days, notes, born, loadNotes, onDay, onBack }: Props) {
  const framed = Object.keys(days)
    .filter((iso) => days[iso].framed)
    .sort()
  useEffect(() => framed.forEach(loadNotes), [framed.join()]) // eslint-disable-line react-hooks/exhaustive-deps
  const age = (iso: string) => {
    if (!born) return null
    if (iso === born) return 'born'
    const a = ageOn(born, iso)
    return a.years ? `age ${a.years}` : 'first year'
  }
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
            const a = age(iso)
            return (
              <li key={iso}>
                <button className="framed-day" onClick={() => onDay(iso)} style={frameVars(day.color)}>
                  <span
                    className="framed-square"
                    style={{ background: squareFill(day.color, true) }}
                    aria-hidden="true"
                  />
                  <span className="framed-text">
                    <span className="framed-date">
                      {plainDate(iso)}
                      {a && <span className="framed-age"> · {a}</span>}
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
