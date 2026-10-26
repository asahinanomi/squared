import { createContext, useContext } from 'react'

type Props = {
  /** Zoom out one level (see more); absent when there's no level further out yet. */
  onOut?: () => void
  /** Zoom in one level (see less, closer). */
  onIn?: () => void
  /** Back to today's square on this same screen — shown (as ◎) only once it has scrolled out of view. */
  onRecenter?: () => void
  /** The day the list should open on if switched to from here (default: today). */
  listAt?: () => string
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
} | null>(null)

// Bottom of every zoom level, controls only: on the left one switch for the two views — squares · list (the pie is in my days),
// the one showing raised — then "today" (go paint it)
// halfway to the zoom pair on the right. ◎ (back to today's square, once it's out of view) floats
// just above the bar's right end.
export function ZoomBar({ onOut, onIn, onRecenter, listAt }: Props) {
  const view = useContext(ViewSwitch)
  return (
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
      {view && (
        <button className="zoombar-today" onClick={view.goToday}>
          today
        </button>
      )}
      {/* Floats just above the bar's right end, over the content, only while today is out of view. */}
      {onRecenter && (
        <button className="zoombar-recenter" aria-label="Back to today's square" onClick={onRecenter}>
          <RecenterIcon />
        </button>
      )}
      {/* No zoom at all where there's nothing to zoom (the list: its tabs choose years · months · days). */}
      {(onIn || onOut) && (
        <div className="zoombar-buttons">
          {/* Zoom out is always the far right, where it is on the day screen (its only button), lined up with the menu;
            zoom in sits to its left. */}
          <button aria-label="Zoom in" disabled={!onIn} onClick={onIn}>
            <ZoomInIcon />
          </button>
          <button aria-label="Zoom out" disabled={!onOut} onClick={onOut}>
            <ZoomOutIcon />
          </button>
        </div>
      )}
      {/* With no zoom, an empty right as wide as the switch keeps "today" in the centre. */}
      {!onIn && !onOut && view && <span className="zoombar-spacer" aria-hidden="true" />}
    </div>
  )
}
