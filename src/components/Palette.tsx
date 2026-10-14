import { PAINTS, type Paint } from '../lib/paints'
import './Palette.css'

type Props = {
  loaded: Paint | null
  /** Gentle wiggle when someone tries to paint with a clean brush. */
  nudge?: boolean
  onLoad: (p: Paint) => void
}

// Drawn to match the reference illustration (traced at 1/5 scale). Tap zones (r 26.5) stop just short of each other.
const R = 25
const HIT = 26.5
const WELLS: Record<Paint, { x: number; y: number }> = {
  green: { x: 112, y: 74 },
  grey: { x: 102, y: 127 },
  red: { x: 172, y: 100 },
}

const BOARD =
  'M54 100C55 60 92 36 150 35C190 34 216 48 230 64C236 80 228 112 225 130C231 134 236 139 236 145C236 160 214 168 170 170C120 172 82 168 64 150C56 140 53 120 54 100Z'
const HANDLE = 'M216 98.7L253.5 28.9A8.5 8.5 0 0 1 268.5 37.1L230 106.3Z'
const FERRULE = 'M216 98.7L230 106.3L223.4 117.5L210.2 110.3Z'
const HEAD = 'M210.2 110.3C200 120 194 132 192 153C191.6 157 194 158.4 197 157C214 150 227 136 223.4 117.5Z'

// Outlines stay exactly --keyline wide whatever size the palette is drawn at.
const line = { vectorEffect: 'non-scaling-stroke' } as const

/** Blend a hex color toward white (t > 0) or black (t < 0). */
function shade(hex: string, t: number) {
  const to = t > 0 ? 255 : 0
  const k = Math.abs(t)
  const ch = (i: number) => {
    const v = parseInt(hex.slice(i, i + 2), 16)
    return Math.round(v + (to - v) * k)
      .toString(16)
      .padStart(2, '0')
  }
  return `#${ch(1)}${ch(3)}${ch(5)}`
}

/** An arc of radius r around the origin, between two angles in degrees (0 = right, 90 = down). */
function arc(r: number, from: number, to: number) {
  const p = (a: number) =>
    `${(r * Math.cos((a * Math.PI) / 180)).toFixed(2)} ${(r * Math.sin((a * Math.PI) / 180)).toFixed(2)}`
  return `M${p(from)}A${r} ${r} 0 0 1 ${p(to)}`
}

export function Palette({ loaded, nudge, onLoad }: Props) {
  return (
    <svg
      className={'palette' + (nudge ? ' is-nudging' : '')}
      viewBox="48 22 224 152"
      role="radiogroup"
      aria-label="Paint palette"
    >
      <defs>
        {PAINTS.map(({ id, hex }) => (
          <g key={id}>
            {/* Domed wet paint, lit from the top-left; the rim darkens most at the bottom-right. */}
            <radialGradient id={`pal-dome-${id}`} cx="0.5" cy="0.5" r="0.5" fx="0.4" fy="0.36">
              <stop offset="0" stopColor={shade(hex, 0.14)} />
              <stop offset="0.8" stopColor={hex} />
              <stop offset="0.9" stopColor={shade(hex, -0.2)} />
              <stop offset="1" stopColor={shade(hex, -0.24)} />
            </radialGradient>
            {/* Pressed into a bowl: the top-left wall falls into shadow, the bottom-right catches light. */}
            <radialGradient id={`pal-dent-${id}`} cx="0.5" cy="0.5" r="0.5" fx="0.62" fy="0.66">
              <stop offset="0" stopColor={shade(hex, 0.06)} />
              <stop offset="0.6" stopColor={shade(hex, -0.1)} />
              <stop offset="1" stopColor={shade(hex, -0.42)} />
            </radialGradient>
            <linearGradient id={`pal-head-${id}`} x1="0.8" y1="0" x2="0.2" y2="1">
              <stop offset="0" stopColor={shade(hex, 0.12)} />
              <stop offset="1" stopColor={shade(hex, -0.12)} />
            </linearGradient>
          </g>
        ))}
        <linearGradient id="pal-ferrule" x1="0" y1="0" x2="1" y2="0.6">
          <stop offset="0" stopColor="#ececea" />
          <stop offset="1" stopColor="#bdbdba" />
        </linearGradient>
      </defs>

      <path className="palette-board" style={line} d={BOARD} />

      {PAINTS.map(({ id }) => {
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
            <circle className="well-hit" cx={x} cy={y} r={HIT} />
            <g transform={`translate(${x} ${y})`}>
              <g className="well-body">
                <circle className="well-ring" style={line} r={R + 4} />
                <g className="well-dome">
                  <circle r={R} fill={`url(#pal-dome-${id})`} />
                  <path className="well-shine" d={arc(R * 0.7, 196, 248)} />
                  <ellipse className="well-glint" cx={-3} cy={-17.5} rx={2.4} ry={1.3} transform="rotate(-18 -3 -17.5)" />
                </g>
                {/* Dipped: the whole well is scooped into a bowl. */}
                <g className="well-dent">
                  <circle r={R} fill={`url(#pal-dent-${id})`} />
                  <path className="dent-shade" d={arc(R - 3.2, 150, 300)} />
                  <path className="dent-lip" d={arc(R - 2.6, 5, 95)} />
                </g>
                <circle className="well-edge" style={line} r={R} />
              </g>
            </g>
          </g>
        )
      })}

      {/* Brush resting in the thumb notch, its head full of the loaded paint. */}
      <g className="brush" pointerEvents="none">
        <path style={line} d={HANDLE} className="brush-handle" />
        <path d="M253 40L237 67" className="brush-shine" />
        <path style={line} d={FERRULE} className="brush-ferrule" />
        <path d={HEAD} className="brush-clean" />
        {PAINTS.map(({ id }) => (
          <path
            key={id}
            d={HEAD}
            fill={`url(#pal-head-${id})`}
            className={'brush-load' + (loaded === id ? ' is-on' : '')}
          />
        ))}
        <path style={line} d={HEAD} className="brush-head" />
        <path d="M208 121C205 128 203 133 201 138M215 124C212 133 209 140 205 146" className="brush-hairs" />
      </g>
    </svg>
  )
}
