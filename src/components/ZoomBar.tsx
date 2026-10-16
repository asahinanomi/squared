type Props = {
  /** Quiet helper text on the left. */
  hint: string
  /** Zoom out one level (see more); absent when there's no level further out yet. */
  onOut?: () => void
  /** Zoom in one level (see less, closer). */
  onIn?: () => void
}

const stroke = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
} as const

// Bottom of every zoom level: a helper line, and the two zoom controls (out = expand, in = contract).
export function ZoomBar({ hint, onOut, onIn }: Props) {
  return (
    <div className="zoombar">
      <p className="zoombar-hint">{hint}</p>
      <div className="zoombar-buttons">
        <button aria-label="Zoom out" disabled={!onOut} onClick={onOut}>
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
        </button>
        <button aria-label="Zoom in" disabled={!onIn} onClick={onIn}>
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
        </button>
      </div>
    </div>
  )
}
