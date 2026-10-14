import { Palette } from '../components/Palette'
import { Question } from '../components/Question'
import { WhyBubble } from '../components/WhyBubble'
import { addDays, longDate, monthCells, sameMonth, todayIso } from '../lib/dates'
import type { Day } from '../lib/mock'
import { paintHex, type Paint } from '../lib/paints'

type Props = {
  question: string
  date: string
  days: Record<string, Day>
  loaded: Paint | null
  showWhy: boolean
  onDate: (iso: string) => void
  onLoad: (p: Paint) => void
  onDefine: () => void
  onWhyDone: (note: string) => void
}

export function Today({ question, date, days, loaded, showWhy, onDate, onLoad, onDefine, onWhyDone }: Props) {
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
        <button aria-label="Next day" disabled={!sameMonth(next, today)} onClick={() => onDate(next)}>
          <Chevron dir="right" />
        </button>
      </div>

      <div className="easel">
        <div className="ghost-grid" aria-hidden="true">
          {monthCells(date).map((iso, i) => (
            <span
              key={iso ?? `b${i}`}
              className={'ghost' + (iso ? '' : ' is-blank') + (iso && days[iso] ? ' is-painted' : '')}
              style={iso && days[iso] ? { background: paintHex(days[iso].color) } : undefined}
            />
          ))}
        </div>
        <div
          className={'canvas' + (date === today ? ' is-today' : '')}
          style={day ? { background: paintHex(day.color) } : undefined}
          aria-label={day ? `Painted ${day.color}` : 'Unpainted'}
        />
      </div>

      <div className="tray">
        {showWhy ? <WhyBubble initial={day?.note} onDone={onWhyDone} /> : <Palette loaded={loaded} onLoad={onLoad} />}
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
