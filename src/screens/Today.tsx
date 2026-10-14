import { NoteCard } from '../components/NoteCard'
import { PaintCanvas } from '../components/PaintCanvas'
import { Palette } from '../components/Palette'
import { Question } from '../components/Question'
import { WhyBubble } from '../components/WhyBubble'
import { addDays, longDate, monthCells, sameMonth, todayIso } from '../lib/dates'
import type { Days } from '../lib/days'
import { paintHex, type Paint } from '../lib/paints'

type Props = {
  question: string
  date: string
  days: Days
  loaded: Paint | null
  showWhy: boolean
  nudge: boolean
  onDate: (iso: string) => void
  onLoad: (p: Paint) => void
  onDefine: () => void
  onWhyDone: (note: string) => void
  onEditNote: () => void
  onDryBrush: () => void
  onFilled: (p: Paint) => void
}

export function Today(props: Props) {
  const { question, date, days, loaded, showWhy, nudge, onDate, onLoad, onDefine, onWhyDone, onEditNote, onDryBrush, onFilled } = props
  const today = todayIso()
  const prev = addDays(date, -1)
  const next = addDays(date, 1)
  const day = days[date]
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
        />
      </div>

      <div className="tray">
        {showWhy ? (
          <WhyBubble initial={day?.note} onDone={onWhyDone} />
        ) : (
          <>
            <Palette loaded={loaded} nudge={nudge} onLoad={onLoad} />
            {day && <NoteCard note={day.note} noteAt={day.noteAt} onEdit={onEditNote} />}
          </>
        )}
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
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
