import { PAINTS, paintHex, type Paint } from '../lib/paints'
import './Palette.css'

type Props = {
  loaded: Paint | null
  /** Gentle wiggle when someone tries to paint with a clean brush. */
  nudge?: boolean
  onLoad: (p: Paint) => void
}

// Well positions on the board (viewBox 0 0 270 190). Centers sit ~70 units apart so each
// well's tap zone (r 33 ≈ 46px on a phone) never overlaps its neighbour's.
const WELLS: Record<Paint, { x: number; y: number }> = {
  green: { x: 82, y: 70 },
  grey: { x: 62, y: 136 },
  red: { x: 140, y: 120 },
}

// Outlines stay exactly --keyline wide whatever size the palette is drawn at.
const line = { vectorEffect: 'non-scaling-stroke' } as const

export function Palette({ loaded, nudge, onLoad }: Props) {
  const tip = loaded ? paintHex(loaded) : '#f4f4f1'
  return (
    <svg
      className={'palette' + (nudge ? ' is-nudging' : '')}
      viewBox="0 0 270 190"
      role="radiogroup"
      aria-label="Paint palette"
    >
      <path
        className="palette-board"
        style={line}
        transform="scale(1.1 1)"
        d="M40 46C82 18 170 20 204 50C226 70 214 92 190 98C170 103 166 122 184 138C200 152 178 176 132 178C76 181 20 168 14 120C10 88 16 62 40 46Z"
      />

      {PAINTS.map(({ id, hex }) => {
        const { x, y } = WELLS[id]
        const on = loaded === id
        return (
          <g
            key={id}
            className={'well' + (on ? ' is-loaded' : '')}
            role="radio"
            aria-checked={on}
            aria-label={id}
            tabIndex={0}
            onClick={() => onLoad(id)}
            onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onLoad(id)}
          >
            <circle className="well-hit" cx={x} cy={y} r={33} />
            <ellipse className="well-shadow" cx={x} cy={y + 8} rx={24} ry={8} />
            <g className="well-lift" style={{ transformOrigin: `${x}px ${y}px` }}>
              <circle className="well-ring" style={line} cx={x} cy={y} r={29} />
              <circle className="well-paint" style={line} cx={x} cy={y} r={23} fill={hex} />
              <ellipse className="well-gloss" cx={x - 8} cy={y - 9} rx={7.5} ry={4.5} />
            </g>
          </g>
        )
      })}

      {/* Brush resting across the thumb hole, its tip carrying the loaded paint. */}
      <g className="brush" pointerEvents="none" transform="translate(40 0)">
        <path style={line} d="M216 14C222 10 230 16 226 23L178 104L164 96L208 18Z" className="brush-handle" />
        <path style={line} d="M164 96L178 104L170 118L154 110Z" className="brush-ferrule" />
        <path
          style={line}
          d="M154 110L170 118C168 134 158 148 140 156C134 158 130 154 132 148C136 134 144 120 154 110Z"
          fill={tip}
          className="brush-tip"
        />
        <path d="M150 122C146 132 142 140 138 148M158 124C154 134 150 142 145 150" className="brush-hairs" />
      </g>
    </svg>
  )
}
