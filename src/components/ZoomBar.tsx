import { createPortal } from 'react-dom'
import { createContext, useContext, useEffect, useState } from 'react'
import { squareFill, type Paint } from '../lib/paints'

type Props = {
  /** Zoom out one level (see more); absent when there's no level further out yet. */
  onOut?: () => void
  /** Zoom in one level (see less, closer). */
  onIn?: () => void
  /** Back to today's square on this same screen — shown (as ◎) only once it has scrolled out of view. */
  onRecenter?: () => void
  /** The day the list should open on if switched to from here (default: today). */
  listAt?: () => string
  /** "today" in the centre: the app's way back to today by default; the day screen passes its own. */
  today?: () => void
  /** On today itself: today's square stays, underlined (you're here), and a tap gives the square a small pulse
   *  instead. */
  here?: () => void
}

const stroke = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2.2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
} as const

/** Arrows pointing out: see more. */
export const ZoomOutIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" {...stroke}>
    <polyline points="3.5 8 3.5 3.5 8 3.5" />
    <line x1="3.5" y1="3.5" x2="10" y2="10" />
    <polyline points="16 3.5 20.5 3.5 20.5 8" />
    <line x1="20.5" y1="3.5" x2="14" y2="10" />
    <polyline points="20.5 16 20.5 20.5 16 20.5" />
    <line x1="20.5" y1="20.5" x2="14" y2="14" />
    <polyline points="8 20.5 3.5 20.5 3.5 16" />
    <line x1="3.5" y1="20.5" x2="10" y2="14" />
  </svg>
)

/** Arrows pointing in: come closer. */
export const ZoomInIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" {...stroke}>
    <polyline points="4.5 9 9 9 9 4.5" />
    <line x1="9" y1="9" x2="3.5" y2="3.5" />
    <polyline points="15 4.5 15 9 19.5 9" />
    <line x1="15" y1="9" x2="20.5" y2="3.5" />
    <polyline points="19.5 15 15 15 15 19.5" />
    <line x1="15" y1="15" x2="20.5" y2="20.5" />
    <polyline points="9 19.5 9 15 4.5 15" />
    <line x1="9" y1="15" x2="3.5" y2="20.5" />
  </svg>
)

/** Squares, one painted: back to the zoom levels. Drawn to the zoom icons' height. */
const SquaresIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" {...stroke}>
    <rect x="3.5" y="3.5" width="6" height="6" rx="1.2" />
    <rect x="14.5" y="3.5" width="6" height="6" rx="1.2" fill="currentColor" />
    <rect x="3.5" y="14.5" width="6" height="6" rx="1.2" />
    <rect x="14.5" y="14.5" width="6" height="6" rx="1.2" />
  </svg>
)

/** Lines, each led by a dot: the days as a list, to read. Drawn to the zoom icons' height. */
const ListIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" {...stroke}>
    <circle cx="4.5" cy="5.5" r="1.4" fill="currentColor" stroke="none" />
    <circle cx="4.5" cy="12" r="1.4" fill="currentColor" stroke="none" />
    <circle cx="4.5" cy="18.5" r="1.4" fill="currentColor" stroke="none" />
    <line x1="9.5" y1="5.5" x2="20.5" y2="5.5" />
    <line x1="9.5" y1="12" x2="20.5" y2="12" />
    <line x1="9.5" y1="18.5" x2="20.5" y2="18.5" />
  </svg>
)

/** A target: back to where today is. */
const RecenterIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" {...stroke}>
    <circle cx="12" cy="12" r="8.5" />
    <circle cx="12" cy="12" r="3" fill="currentColor" />
  </svg>
)

/**
 * What every bar needs from the app: the other view beside the squares, the list of days (`list` = it's showing;
 * `toggleList` takes the day to open on), and the way to today.
 */
export const ViewSwitch = createContext<{
  list: boolean
  toggleList: (at?: string) => void
  goToday: () => void
  /** my days: the bar's right, the reflection home, one tap from anywhere. */
  goMyDays: () => void
  /** Today's paint, once it's painted: the bar's square shows it. */
  todayPaint?: Paint
} | null>(null)

// The bar in squares (lab row 10, A7): today is its square, an ink edge until you paint, then today's paint, so the bar
// always says whether today is done. my days is two squares, stacked, the day behind in grey. Where you are: squared's
// dotted ink underline (the one under "meaningfully"), never a pressed or raised look, so it never fights the switch.
// The underline's room is always kept, so the squares never shift.
// Lab: https://claude.ai/artifact/8RNH3LHkF4RtJ3QchG5fkm (row 10, A7)
function TodayPlace({ paint, here, onClick }: { paint?: Paint; here: boolean; onClick: () => void }) {
  return (
    <button
      className={'bar-place' + (here ? ' is-here' : '')}
      aria-label="today"
      aria-current={here ? 'page' : undefined}
      onClick={onClick}
    >
      <span
        className={'bar-today' + (paint ? ' is-painted' : '')}
        style={paint ? { background: squareFill(paint) } : undefined}
      />
      <span className="bar-here" aria-hidden="true" />
    </button>
  )
}

function MyDaysPlace({ here, onClick }: { here: boolean; onClick: () => void }) {
  return (
    <button
      className={'bar-place bar-place-mydays' + (here ? ' is-here' : '')}
      aria-label="my days"
      aria-current={here ? 'page' : undefined}
      onClick={onClick}
    >
      <span className="bar-stack" aria-hidden="true">
        <i />
        <i />
      </span>
      <span className="bar-here" aria-hidden="true" />
    </button>
  )
}

// Bottom of every square view and the list: the bar is for getting around (the squares · list switch on the left,
// "today" in the centre, the same on every page). Zoom is a tool on the squares, not a way around, so it floats over
// them at the bottom right, like a map's + and −: a slim capsule (zoom in on top, zoom out below; on a day, zoom out
// alone), with ◎ (back to today's square, once it's out of view) on top of it. The list has no zoom: nothing floats.
export function ZoomBar({ onOut, onIn, onRecenter, listAt, today, here }: Props) {
  const view = useContext(ViewSwitch)
  const goToday = today ?? view?.goToday
  // Scrolled down the page (a day's notes): you're reading, not zooming, so the zoom steps aside until you're back up.
  // The squares and the list scroll inside themselves, so this only happens on a day. Pinch works all the while.
  const [reading, setReading] = useState(false)
  useEffect(() => {
    const on = () => setReading(window.scrollY > 24)
    on()
    window.addEventListener('scroll', on, { passive: true })
    return () => window.removeEventListener('scroll', on)
  }, [])
  // Outside the stage, which scales while a zoom animates (a pinned bar inside it would ride along).
  return createPortal(
    <>
      <div className="zoombar">
        {view ? (
          // One switch for the two ways to look: squares · list. The one showing is raised.
          <div className="zoombar-switch" role="group" aria-label="View">
            {(
              [
                ['squares', 'Squares', <SquaresIcon key="s" />],
                ['list', 'List view', <ListIcon key="l" />],
              ] as const
            ).map(([id, label, icon]) => {
              const now = view.list ? 'list' : 'squares'
              const go = () => {
                if (id !== now) view.toggleList(listAt?.())
              }
              return (
                <button
                  key={id}
                  className={id === now ? 'is-on' : undefined}
                  aria-label={label}
                  aria-pressed={id === now}
                  onClick={go}
                >
                  {icon}
                </button>
              )
            })}
          </div>
        ) : (
          <span />
        )}
        {here || goToday ? <TodayPlace paint={view?.todayPaint} here={!!here} onClick={here ?? goToday!} /> : <span />}
        {/* my days on the right, as wide as the switch, so today stays in the centre. */}
        {view ? (
          <MyDaysPlace here={false} onClick={view.goMyDays} />
        ) : (
          <span className="zoombar-spacer" aria-hidden="true" />
        )}
      </div>
      {(onIn || onOut || onRecenter) && (
        <div className={'zoom-stack' + (reading ? ' is-reading' : '')}>
          {onRecenter && (
            <button className="zoombar-recenter" aria-label="Back to today's square" onClick={onRecenter}>
              <RecenterIcon />
            </button>
          )}
          {(onIn || onOut) && (
            <div className="zoom-capsule">
              {onIn && (
                <button aria-label="Zoom in" onClick={onIn}>
                  <ZoomInIcon />
                </button>
              )}
              <button aria-label="Zoom out" disabled={!onOut} onClick={onOut}>
                <ZoomOutIcon />
              </button>
            </div>
          )}
        </div>
      )}
    </>,
    document.body,
  )
}

/**
 * The same bar on every other page (my days, settings, about…): the squares · list switch on the left, neither raised
 * (you're not in a view: squares opens this month, list the days), and "today" in the centre, the one constant way back
 * to now. The bar never changes shape.
 */
export function PageBar({
  onToday,
  onSquares,
  onList,
  onMyDays,
  atMyDays,
}: {
  onToday: () => void
  onSquares: () => void
  onList: () => void
  onMyDays: () => void
  /** On my days itself: its squares underlined ("you're here"), as today's square is on today. */
  atMyDays: boolean
}) {
  const view = useContext(ViewSwitch)
  return createPortal(
    <div className="zoombar">
      <div className="zoombar-switch" role="group" aria-label="View">
        <button aria-label="Squares" onClick={onSquares}>
          <SquaresIcon />
        </button>
        <button aria-label="List view" onClick={onList}>
          <ListIcon />
        </button>
      </div>
      <TodayPlace paint={view?.todayPaint} here={false} onClick={onToday} />
      <MyDaysPlace here={atMyDays} onClick={onMyDays} />
    </div>,
    document.body,
  )
}
