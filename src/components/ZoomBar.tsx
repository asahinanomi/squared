import { createContext, useContext } from 'react'

type Props = {
  /** Zoom out one level (see more); absent when there's no level further out yet. */
  onOut?: () => void
  /** Zoom in one level (see less, closer). */
  onIn?: () => void
  /** Back to today's square on this same screen — shown (as ◎) only once it has scrolled out of view. */
  onRecenter?: () => void
}

const stroke = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
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

/** A pie: the whole life in slices. Drawn to the zoom icons' height. */
export const PieIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" {...stroke}>
    <circle cx="12" cy="12" r="8.5" />
    <line x1="12" y1="12" x2="12" y2="3.5" />
    <line x1="12" y1="12" x2="19.4" y2="16.25" />
  </svg>
)

/** Squares, one painted: back to the zoom levels. Drawn to the zoom icons' height. */
export const SquaresIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" {...stroke}>
    <rect x="3.5" y="3.5" width="6" height="6" rx="1.2" />
    <rect x="14.5" y="3.5" width="6" height="6" rx="1.2" fill="currentColor" />
    <rect x="3.5" y="14.5" width="6" height="6" rx="1.2" />
    <rect x="14.5" y="14.5" width="6" height="6" rx="1.2" />
  </svg>
)

/** A target: back to where today is. */
export const RecenterIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" {...stroke}>
    <circle cx="12" cy="12" r="8.5" />
    <circle cx="12" cy="12" r="3" fill="currentColor" />
  </svg>
)

/** What every bar needs from the app: the pie ↔ squares switch (`pie` = the pie is showing), and the way to today. */
export const ViewSwitch = createContext<{ pie: boolean; toggle: () => void; goToday: () => void } | null>(null)

// Bottom of every zoom level, controls only: the pie ↔ squares switch on the left, "today" (go paint it)
// pinned to the centre, and on the right ◎ (back to today's square, once it's out of view) and the zoom pair.
export function ZoomBar({ onOut, onIn, onRecenter }: Props) {
  const view = useContext(ViewSwitch)
  return (
    <div className="zoombar">
      {view ? (
        <button className="zoombar-view" aria-label={view.pie ? 'Squares' : 'Pie view'} onClick={view.toggle}>
          {view.pie ? <SquaresIcon /> : <PieIcon />}
        </button>
      ) : (
        <span />
      )}
      {view && (
        <button className="zoombar-today" onClick={view.goToday}>
          today
        </button>
      )}
      <div className="zoombar-buttons">
        {onRecenter && (
          <button className="zoombar-recenter" aria-label="Back to today's square" onClick={onRecenter}>
            <RecenterIcon />
          </button>
        )}
        <button aria-label="Zoom out" disabled={!onOut} onClick={onOut}>
          <ZoomOutIcon />
        </button>
        <button aria-label="Zoom in" disabled={!onIn} onClick={onIn}>
          <ZoomInIcon />
        </button>
      </div>
    </div>
  )
}
