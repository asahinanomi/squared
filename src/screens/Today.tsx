import { NotesList } from '../components/NotesList'
import { PaintCanvas } from '../components/PaintCanvas'
import { Palette } from '../components/Palette'
import { Question } from '../components/Question'
import { WhyBubble } from '../components/WhyBubble'
import { addDays, longDate, monthCells, sameMonth, todayIso } from '../lib/dates'
import type { Days } from '../lib/days'
import type { Note } from '../lib/notes'
import { paintHex, type Paint } from '../lib/paints'

type Props = {
  question: string
  date: string
  days: Days
  notes: Note[]
  loaded: Paint | null
  /** The open "why?" bubble: a new note, or an existing note being edited. */
  why: { note?: Note } | null
  nudge: boolean
  onDate: (iso: string) => void
  onLoad: (p: Paint) => void
  onDefine: () => void
  /** Saves a new note, or updates `note`; rejects with a readable message on failure. */
  onSaveNote: (note: Note | undefined, text: string) => Promise<void>
  onDeleteNote: (note: Note) => Promise<void>
  onCloseWhy: () => void
  onOpenWhy: (note?: Note) => void
  onDryBrush: () => void
  onFilled: (p: Paint) => void
}

export function Today(props: Props) {
  const { question, date, days, notes, loaded, why, nudge, onDate, onLoad, onDefine, onDryBrush, onFilled } = props
  const { onSaveNote, onDeleteNote, onCloseWhy, onOpenWhy } = props
  const today = todayIso()
  const prev = addDays(date, -1)
  const next = addDays(date, 1)
  const day = days[date]

  // A tap just outside the square goes to the grid day underneath it.
  const tapGridDay = (x: number, y: number) => {
    const cell = document.elementsFromPoint(x, y).find((el) => el.classList.contains('ghost'))
    if (cell instanceof HTMLButtonElement && !cell.disabled) cell.click()
  }
  return (
    <main className="today">
      <Question text={question} onDefine={onDefine} />

      <div className="day-nav">
        <button aria-label="Previous day" disabled={!sameMonth(prev, today)} onClick={() => onDate(prev)}>
          <Chevron dir="left" />
        </button>
        <span className="day-label">{longDate(date)}</span>
        <button aria-label="Next day" disabled={next > today} onClick={() => onDate(next)}>
          <Chevron dir="right" />
        </button>
      </div>

      <div className="easel">
        {/* The month behind the square: tap a day to go to it (not future days). */}
        <div className="ghost-grid">
          {monthCells(date).map((iso, i) =>
            iso ? (
              <button
                key={iso}
                className={'ghost' + (days[iso] ? ' is-painted' : '') + (iso === date ? ' is-current' : '')}
                style={days[iso] ? { background: paintHex(days[iso].color) + '4d' } : undefined}
                disabled={iso > today}
                aria-label={longDate(iso)}
                onClick={() => onDate(iso)}
              >
                {Number(iso.slice(8))}
              </button>
            ) : (
              <span key={`b${i}`} />
            ),
          )}
        </div>
        <PaintCanvas
          key={`${date}:${day?.color ?? ''}`}
          saved={day?.color}
          loaded={loaded}
          onDryBrush={onDryBrush}
          onFilled={onFilled}
          onMarginTap={tapGridDay}
        />
      </div>

      <div className="tray">
        {why && (
          <WhyBubble
            key={why.note?.id ?? 'new'}
            initial={why.note?.body}
            editing={!!why.note}
            onSave={(text) => onSaveNote(why.note, text)}
            onDelete={why.note ? () => onDeleteNote(why.note!) : undefined}
            onCancel={onCloseWhy}
          />
        )}
        {/* Kept mounted (just hidden) while writing, so opened notes stay open afterwards. */}
        <div className="tray-rest" hidden={!!why}>
          <Palette loaded={loaded} nudge={nudge} onLoad={onLoad} />
          {(day || notes.length > 0) && (
            <NotesList
              key={date}
              notes={notes}
              onOpen={(n) => onOpenWhy(n)}
              onAdd={() => onOpenWhy()}
              onDelete={onDeleteNote}
            />
          )}
        </div>
      </div>
    </main>
  )
}

export function Chevron({ dir }: { dir: 'left' | 'right' }) {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d={dir === 'left' ? 'M15 5l-7 7 7 7' : 'M9 5l7 7-7 7'}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        vectorEffect="non-scaling-stroke"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
