import { useEffect, useState } from 'react'
import { NotesList } from '../components/NotesList'
import { PaintCanvas } from '../components/PaintCanvas'
import { Palette } from '../components/Palette'
import { Question } from '../components/Question'
import { WhyBubble } from '../components/WhyBubble'
import { ZoomInIcon, ZoomOutIcon } from '../components/ZoomBar'
import { addDays, longDate, monthCells, shortDateParts, shortWeekday, todayIso } from '../lib/dates'
import type { Days } from '../lib/days'
import type { Note, Why } from '../lib/notes'
import { PAINTS, paintHex, type Paint } from '../lib/paints'

type Props = {
  question: string
  /** Birth date, if known: the earliest day you can step back to. */
  born?: string
  date: string
  days: Days
  notes: Note[]
  loaded: Paint | null
  /** The open "why?" bubble: a new note, or an existing note being edited. */
  why: Why | null
  nudge: boolean
  onDate: (iso: string) => void
  onLoad: (p: Paint) => void
  onDefine: () => void
  /** Saves a new note, or updates `note` (instantly; a failure reopens the box). */
  onSaveNote: (note: Note | undefined, text: string) => Promise<void>
  onDeleteNote: (note: Note) => Promise<void>
  onCloseWhy: () => void
  onOpenWhy: (note?: Note) => void
  onDryBrush: () => void
  onFilled: (p: Paint) => void
  /** Zoom out to the month. */
  onZoomOut: () => void
}

export function Today(props: Props) {
  const { question, born, date, days, notes, loaded, why, nudge, onDate, onLoad, onDefine, onDryBrush, onFilled } =
    props
  const { onSaveNote, onDeleteNote, onCloseWhy, onOpenWhy, onZoomOut } = props
  const today = todayIso()
  const prev = addDays(date, -1)
  const next = addDays(date, 1)
  const day = days[date]

  // On each dip, the color's meaning whispers under the palette, then fades (sooner if painting starts).
  const [whisper, setWhisper] = useState<{ paint: Paint; at: number } | null>(null)
  const [whispering, setWhispering] = useState(false)
  useEffect(() => {
    if (!whisper) return
    setWhispering(true)
    const t = setTimeout(() => setWhispering(false), 3500)
    return () => clearTimeout(t)
  }, [whisper])
  const dip = (p: Paint) => {
    onLoad(p)
    setWhisper({ paint: p, at: Date.now() })
  }

  // A tap just outside the square goes to the grid day underneath it.
  const tapGridDay = (x: number, y: number) => {
    const cell = document.elementsFromPoint(x, y).find((el) => el.classList.contains('ghost'))
    if (cell instanceof HTMLButtonElement && !cell.disabled) cell.click()
  }
  return (
    <main className="today">
      <Question text={question} onDefine={onDefine} />

      <div className="day-nav">
        <button aria-label="Previous day" disabled={!!born && prev < born} onClick={() => onDate(prev)}>
          <Chevron dir="left" />
        </button>
        <DayLabel iso={date} />
        <button aria-label="Next day" disabled={next > today} onClick={() => onDate(next)}>
          <Chevron dir="right" />
        </button>
      </div>

      <div className="easel" onPointerDown={() => setWhispering(false)}>
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
                <span className="ghost-wd">{shortWeekday(iso)}</span>
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
            key={`${why.note?.id ?? 'new'}:${why.n ?? 0}`}
            initial={why.draft ?? why.note?.body}
            original={why.note?.body}
            initialError={why.error}
            editing={!!why.note}
            onSave={(text) => onSaveNote(why.note, text)}
            onDelete={why.note ? () => onDeleteNote(why.note!) : undefined}
            onCancel={onCloseWhy}
          />
        )}
        {/* Kept mounted (just hidden) while writing, so opened notes stay open afterwards. */}
        <div className="tray-rest" hidden={!!why}>
          <Palette loaded={loaded} nudge={nudge} onLoad={dip} />
          <p className={'whisper' + (whispering ? ' is-on' : '')} aria-live="polite">
            {whisper && (
              <>
                <span className="whisper-dot" style={{ background: paintHex(whisper.paint) }} />
                {PAINTS.find((x) => x.id === whisper.paint)!.meaning}
              </>
            )}
          </p>
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
      {/* The zoom pair, as on every other level (hidden while writing). */}
      {!why && (
        <div className="today-zoom">
          <button aria-label="Zoom out" onClick={onZoomOut}>
            <ZoomOutIcon />
          </button>
          {/* Already as close as it gets: shown, greyed, like the far end of the ladder. */}
          <button aria-label="Zoom in" disabled>
            <ZoomInIcon />
          </button>
        </div>
      )}
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

/** "Sat, Oct 17th, 2026" with the "th" raised; read aloud in full. */
function DayLabel({ iso }: { iso: string }) {
  const p = shortDateParts(iso)
  return (
    <span className="day-label" aria-label={longDate(iso)}>
      <span aria-hidden="true">
        {p.weekday}, {p.monthDay}
        <sup>{p.suffix}</sup>, {p.year}
      </span>
    </span>
  )
}
