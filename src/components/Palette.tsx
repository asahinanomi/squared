import { PAINTS, type Paint } from '../lib/paints'
import './Palette.css'

type Props = {
  loaded: Paint | null
  /** Gentle wiggle when someone tries to paint with a clean brush. */
  nudge?: boolean
  onLoad: (p: Paint) => void
}

// Drawn to match the reference illustration (traced at 1/5 scale). Tap zones (r 29) stop just short of each other.
const R = 25
const HIT = 29
const WELLS: Record<Paint, { x: number; y: number }> = {
  green: { x: 114, y: 70 },
  grey: { x: 96, y: 132 },
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

/** A closed, wobbly scoop shape: a circle of radius r whose edge wanders by a few fixed ripples. */
function blob(r: number, ripples: [number, number, number][]) {
  const n = 28
  const pts = Array.from({ length: n }, (_, i) => {
    const a = (i / n) * Math.PI * 2
    const k = 1 + ripples.reduce((sum, [amp, freq, phase]) => sum + amp * Math.sin(freq * a + phase), 0)
    return [r * k * Math.cos(a), r * k * Math.sin(a)]
  })
  // Catmull-Rom through the points, as cubic Béziers.
  const f = (v: number) => v.toFixed(2)
  let d = `M${f(pts[0][0])} ${f(pts[0][1])}`
  for (let i = 0; i < n; i++) {
    const [p0, p1, p2, p3] = [pts[(i - 1 + n) % n], pts[i], pts[(i + 1) % n], pts[(i + 2) % n]]
    d += `C${f(p1[0] + (p2[0] - p0[0]) / 6)} ${f(p1[1] + (p2[1] - p0[1]) / 6)} ${f(p2[0] - (p3[0] - p1[0]) / 6)} ${f(p2[1] - (p3[1] - p1[1]) / 6)} ${f(p2[0])} ${f(p2[1])}`
  }
  return d + 'Z'
}

// Each well's scoop has its own shape, so they don't look stamped.
const SCOOPS: Record<Paint, string> = {
  green: blob(11, [[0.1, 2, 0.4], [0.07, 3, 2.1], [0.04, 5, 1.3]]),
  grey: blob(11, [[0.09, 2, 2.6], [0.08, 3, 0.7], [0.05, 4, 3.9]]),
  red: blob(11, [[0.11, 2, 1.5], [0.06, 3, 4.2], [0.04, 5, 0.2]]),
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
            {/* The paint sits in a shallow bowl: its top-left wall in shadow, its bottom-right catching light. */}
            <radialGradient id={`pal-bowl-${id}`} cx="0.5" cy="0.5" r="0.5" fx="0.6" fy="0.64">
              <stop offset="0" stopColor={shade(hex, 0.1)} />
              <stop offset="0.65" stopColor={hex} />
              <stop offset="1" stopColor={shade(hex, -0.36)} />
            </radialGradient>
            {/* Where the brush scooped: deeper, darkest under its top-left edge. */}
            <linearGradient id={`pal-scoop-${id}`} x1="0.2" y1="0" x2="0.8" y2="1">
              <stop offset="0" stopColor={shade(hex, -0.5)} />
              <stop offset="0.55" stopColor={shade(hex, -0.2)} />
              <stop offset="1" stopColor={shade(hex, 0.05)} />
            </linearGradient>
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
                <circle r={R} fill={`url(#pal-bowl-${id})`} />
                <path className="bowl-shade" d={arc(R - 3.2, 150, 300)} />
                <path className="bowl-lip" d={arc(R - 2.6, 5, 95)} />
                {/* Dipped: the brush leaves an uneven scoop near the middle, with a lit ridge of pushed-up paint. */}
                <g className="well-scoop">
                  <path d={SCOOPS[id]} className="scoop-ridge" transform="translate(1.6 1.8) scale(1.1)" />
                  <path d={SCOOPS[id]} fill={`url(#pal-scoop-${id})`} />
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
