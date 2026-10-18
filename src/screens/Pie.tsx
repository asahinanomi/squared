import { ZoomBar } from '../components/ZoomBar'
import { todayIso } from '../lib/dates'
import type { Days } from '../lib/days'
import { paintHex } from '../lib/paints'
import { lifeSlices, SCOPE_ORDER, type Scope, type Slice, type SliceId } from '../lib/pie'
import type { Profile } from '../lib/profile'

type Props = {
  days: Days
  profile: Profile
  /** Which days the pie is out of (held by the app, so pinch can step it too). */
  scope: Scope
  onScope: (s: Scope) => void
}

const fmt = (n: number) => n.toLocaleString('en-US')

const LABEL: Record<SliceId, string> = {
  green: 'lived, it mattered',
  red: 'here, but wasted',
  grey: 'slipped by',
  unpainted: 'lived, not painted',
  ahead: 'still to come',
}

const SCOPE_LABEL: Record<Scope, string> = {
  life: 'whole life',
  lived: 'days I lived',
  painted: 'painted only',
}

const FILL: Record<SliceId, string> = {
  green: paintHex('green'),
  red: paintHex('red'),
  grey: paintHex('grey'),
  unpainted: '#e6e6e1',
  ahead: '#fcfcfa',
}

// Pie geometry, in the drawing's own units (250 × 250, as on the design board).
const C = 125
const R = 120
const at = (turn: number, r = R) => {
  const a = turn * 2 * Math.PI
  return `${(C + r * Math.sin(a)).toFixed(2)} ${(C - r * Math.cos(a)).toFixed(2)}`
}

/** One wedge from turn a to turn b (0 = 12 o'clock, clockwise); a whole turn is a circle. */
function wedge(a: number, b: number) {
  if (b - a >= 1 - 1e-9) return `M${C} ${C - R} A${R} ${R} 0 1 1 ${C} ${C + R} A${R} ${R} 0 1 1 ${C} ${C - R} Z`
  return `M${C} ${C} L${at(a)} A${R} ${R} 0 ${b - a > 0.5 ? 1 : 0} 1 ${at(b)} Z`
}

/** The rim of a wedge alone, from turn a to turn b. */
function rim(a: number, b: number) {
  if (b - a >= 1 - 1e-9) return `M${C} ${C - R} A${R} ${R} 0 1 1 ${C} ${C + R} A${R} ${R} 0 1 1 ${C} ${C - R}`
  return `M${at(a)} A${R} ${R} 0 ${b - a > 0.5 ? 1 : 0} 1 ${at(b)}`
}

// A life pie, in slices: line art like the squares — a 3px rim and 2px lines between the slices, paint in the painted wedges,
// a dashed keyline round the days still to come. Numbers sit inside the wedges that have room for them.
// Three denominators for the same chart; it always opens on the whole life. Zooming in (pinch or
// the zoom buttons) steps closer: whole life → days I lived → painted only.
export function Pie({ days, profile, scope, onScope }: Props) {
  const step = SCOPE_ORDER.indexOf(scope)
  const slices = lifeSlices(days, profile.born, profile.lifespan, todayIso(), scope)
  const total = slices.reduce((s, x) => s + x.count, 0)
  let turn = 0
  const drawn = slices
    .filter((s) => s.count > 0)
    .map((s) => {
      const a = turn
      turn += s.count / total
      return { ...s, a, b: turn }
    })
  const labels = pieLabels(drawn, scope)

  return (
    <main className="pie">
      <div className="life-head">
        <h1 className="life-title">a life pie, in slices</h1>
      </div>

      <div className="seg" role="group" aria-label="Count out of">
        {SCOPE_ORDER.map((id) => (
          <button
            key={id}
            className={id === scope ? 'is-on' : undefined}
            aria-pressed={id === scope}
            onClick={() => onScope(id)}
          >
            {SCOPE_LABEL[id]}
          </button>
        ))}
      </div>

      {/* The pie and its legend share one width, and scroll together when they outgrow the screen. */}
      <div className="pie-body">
        <svg className="pie-chart" viewBox="0 0 250 250" role="img" aria-label={pieLabel(slices)}>
          {/* Nothing to count yet: just the keyline circle. */}
          {!drawn.length && <circle cx={C} cy={C} r={R} fill="#fcfcfa" className="pie-rim" />}
          {/* Paint first, then the lines between slices (the pellets' 2px), then the rim (the hero's 3px). */}
          {drawn.map((s) => (
            <path key={s.id} d={wedge(s.a, s.b)} fill={FILL[s.id]} />
          ))}
          {drawn.length > 1 &&
            drawn.map((s) => <path key={`edge-${s.id}`} d={`M${C} ${C} L${at(s.a)}`} className="pie-edge" />)}
          {drawn.map((s) => (
            <path
              key={`rim-${s.id}`}
              d={rim(s.a, s.b)}
              fill="none"
              className={s.id === 'ahead' ? 'pie-rim is-ahead' : 'pie-rim'}
            />
          ))}
          {labels.map((l) => (
            <g key={l.id} className={'pie-label' + (l.onPaint ? ' is-on-paint' : '')} aria-hidden="true">
              <text x={l.x} y={l.unit ? l.y - 7 : l.y + 5} className="pie-label-n">
                {fmt(l.n)}
              </text>
              {l.unit && (
                <text x={l.x} y={l.y + 9} className="pie-label-unit">
                  {l.unit}
                </text>
              )}
            </g>
          ))}
        </svg>

        <ul className="pie-legend">
          {slices.map((s) => (
            <li key={s.id}>
              <span className={'pie-dot' + (s.id === 'ahead' ? ' is-ahead' : '')} style={{ background: FILL[s.id] }} />
              <span className="pie-legend-label">{LABEL[s.id]}</span>
              <span className="pie-legend-n">{fmt(s.count)}</span>
            </li>
          ))}
        </ul>

        <div className="pie-soon">
          <button disabled>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12 15V4" />
              <path d="M8 7l4-4 4 4" />
              <path d="M5 12v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6" />
            </svg>
            share my pie <span className="pie-soon-tag">soon</span>
          </button>
          <button disabled>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12 4v11" />
              <path d="M8 11l4 4 4-4" />
              <path d="M5 20h14" />
            </svg>
            download <span className="pie-soon-tag">soon</span>
          </button>
        </div>
      </div>

      <ZoomBar
        onIn={step < SCOPE_ORDER.length - 1 ? () => onScope(SCOPE_ORDER[step + 1]) : undefined}
        onOut={step > 0 ? () => onScope(SCOPE_ORDER[step - 1]) : undefined}
      />
    </main>
  )
}

type Drawn = Slice & { a: number; b: number }
type Label = { id: SliceId; x: number; y: number; n: number; unit?: string; onPaint: boolean }

// A wedge holds a number when it's wide enough: two lines need more room than a bare count.
const ROOM = { withUnit: 0.12, bare: 0.06 }

/**
 * The numbers inside the pie. Whole life: the days to paint in their wedge, and the days lived in the
 * widest lived wedge. Days I lived: the days lived, the same way. Painted only: each slice its own count.
 */
function pieLabels(drawn: Drawn[], scope: Scope): Label[] {
  const place = (s: Drawn, n: number, unit?: string): Label | null => {
    if (s.b - s.a < (unit ? ROOM.withUnit : ROOM.bare)) return null
    const [x, y] = at((s.a + s.b) / 2, R * (unit ? 0.5 : 0.6))
      .split(' ')
      .map(Number)
    return { id: s.id, x, y, n, unit, onPaint: s.id !== 'unpainted' && s.id !== 'ahead' }
  }
  const out: (Label | null)[] = []
  if (scope === 'painted') out.push(...drawn.map((s) => place(s, s.count)))
  else {
    const lived = drawn.filter((s) => s.id !== 'ahead')
    const widest = lived.reduce<Drawn | null>((w, s) => (!w || s.count > w.count ? s : w), null)
    const livedDays = lived.reduce((n, s) => n + s.count, 0)
    if (widest) out.push(place(widest, livedDays, 'days lived'))
    const ahead = drawn.find((s) => s.id === 'ahead')
    if (ahead) out.push(place(ahead, ahead.count, 'days to paint'))
  }
  return out.filter((l): l is Label => !!l)
}

const pieLabel = (slices: Slice[]) =>
  'A pie of a life: ' + slices.map((s) => `${LABEL[s.id]} ${fmt(s.count)}`).join(', ')
