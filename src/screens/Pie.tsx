import { useState } from 'react'
import { ZoomBar } from '../components/ZoomBar'
import { todayIso } from '../lib/dates'
import type { Days } from '../lib/days'
import { paintHex, WORD } from '../lib/paints'
import { lifeSlices, SCOPE_ORDER, type Scope, type Slice, type SliceId } from '../lib/pie'
import type { Profile } from '../lib/profile'

type Props = {
  days: Days
  profile: Profile
  /** Which days the pie is out of (held by the app, so pinch can step it too). */
  scope: Scope
  onScope: (s: Scope) => void
  /** "see them →": the days of a slice, in the list. */
  onSee: (id: Exclude<SliceId, 'ahead'>) => void
}

const fmt = (n: number) => n.toLocaleString('en-US')

const LABEL: Record<SliceId, string> = {
  ...WORD,
  unpainted: 'unpainted',
  ahead: 'ahead',
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
export function Pie({ days, profile, scope, onScope, onSee }: Props) {
  // A tapped slice (or legend row) lifts and the rest fade; a line under the pie leads to those days.
  const [picked, setPicked] = useState<SliceId | null>(null)
  const pick = (id: SliceId) => id !== 'ahead' && setPicked(picked === id ? null : id)
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
  // Whole life is two halves first: the days behind you (painted and unpainted) and the days ahead.
  const whole = scope === 'life'
  const lived = slices.filter((s) => s.id !== 'ahead').reduce((n, s) => n + s.count, 0)
  const livedEnd = drawn.find((s) => s.id === 'ahead')?.a ?? 1
  const labels = whole ? halfLabels(drawn, lived, livedEnd) : pieLabels(drawn)
  const chosen = drawn.find((s) => s.id === picked && s.count > 0)

  // A tap on the pie picks the slice under it — or a thin one beside it: a sliver within a few degrees of the
  // tap wins over the wide slice next to it, so the smallest slices can still be reached.
  const onPie = (e: React.MouseEvent<SVGSVGElement>) => {
    const box = e.currentTarget.getBoundingClientRect()
    const x = ((e.clientX - box.left) / box.width) * 250 - C
    const y = ((e.clientY - box.top) / box.height) * 250 - C
    if (Math.hypot(x, y) > R + 8) return
    const t = (Math.atan2(x, -y) / (2 * Math.PI) + 1) % 1
    const near = (s: Drawn) => Math.min(Math.abs(t - (s.a + s.b) / 2), 1 - Math.abs(t - (s.a + s.b) / 2))
    const thin = drawn
      .filter((s) => s.id !== 'ahead' && s.b - s.a < THIN && near(s) < (s.b - s.a) / 2 + REACH)
      .sort((p, q) => near(p) - near(q))[0]
    const hit = thin ?? drawn.find((s) => t >= s.a && t < s.b)
    if (hit) pick(hit.id)
  }
  const faded = (id: SliceId) => (chosen && chosen.id !== id ? ' is-faded' : '')

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
        <svg className="pie-chart" viewBox="0 0 250 250" role="img" aria-label={pieLabel(slices)} onClick={onPie}>
          {/* Nothing to count yet: just the keyline circle. */}
          {!drawn.length && <circle cx={C} cy={C} r={R} fill="#fcfcfa" className="pie-rim" />}
          {/* Paint first, then the lines between slices (the pellets' 2px), then the rim (the hero's 3px). */}
          {drawn.map((s) => (
            <path
              key={s.id}
              d={wedge(s.a, s.b)}
              fill={FILL[s.id]}
              className={'pie-wedge' + (s.id === 'ahead' ? '' : ' is-tappable') + faded(s.id)}
            />
          ))}
          {drawn.length > 1 &&
            drawn.map((s) => (
              <path
                key={`edge-${s.id}`}
                d={`M${C} ${C} L${at(s.a)}`}
                className={'pie-edge' + (whole && (s.id === 'ahead' || s.a === 0) && lived ? ' is-divide' : '')}
              />
            ))}
          {drawn.map((s) => (
            <path
              key={`rim-${s.id}`}
              d={rim(s.a, s.b)}
              fill="none"
              className={s.id === 'ahead' ? 'pie-rim is-ahead' : 'pie-rim'}
            />
          ))}
          {labels.map((l) => (
            <g
              key={l.id}
              className={'pie-label' + (l.onPaint ? ' is-on-paint' : '') + (l.text ? '' : faded(l.id))}
              aria-hidden="true"
            >
              <text x={l.x} y={l.word ? l.y - 1 : l.y + 5} className="pie-label-n">
                {fmt(l.n)}
              </text>
              {l.word && (
                <text x={l.x} y={l.y + 13} className="pie-label-word">
                  {l.text ?? LABEL[l.id]}
                </text>
              )}
            </g>
          ))}
        </svg>

        {/* Once a slice is picked, one line under the pie: the way to its days (the pie names its own wedges). */}
        {chosen && chosen.id !== 'ahead' ? (
          <p className="pie-pick">
            {fmt(chosen.count)} {LABEL[chosen.id]} {chosen.count === 1 ? 'day' : 'days'} ·{' '}
            <button onClick={() => onSee(chosen.id as Exclude<SliceId, 'ahead'>)}>see them →</button>
          </p>
        ) : (
          <p className="pie-pick is-totals" aria-hidden="true" />
        )}

        <ul className="pie-legend">
          {/* Whole life: days ahead, then days lived with what's inside it, indented under it. */}
          {whole && (
            <>
              <li>
                <span className="pie-legend-row">
                  <span className="pie-dot is-ahead" style={{ background: FILL.ahead }} />
                  <span className="pie-legend-label">days ahead</span>
                  <span className="pie-legend-n">{fmt(slices.find((s) => s.id === 'ahead')?.count ?? 0)}</span>
                </span>
              </li>
              <li className="is-group">
                <span className="pie-legend-row">
                  <span className="pie-dot is-lived" />
                  <span className="pie-legend-label">days lived</span>
                  <span className="pie-legend-n">{fmt(lived)}</span>
                </span>
              </li>
            </>
          )}
          {slices
            .filter((s) => !whole || s.id !== 'ahead')
            .map((s) => (
              <li key={s.id} className={(faded(s.id).trim() + (whole ? ' is-inside' : '')).trim() || undefined}>
                <button
                  className="pie-legend-row"
                  disabled={s.id === 'ahead' || !s.count}
                  aria-pressed={picked === s.id}
                  onClick={() => pick(s.id)}
                >
                  <span
                    className={'pie-dot' + (s.id === 'ahead' ? ' is-ahead' : '')}
                    style={{ background: FILL[s.id] }}
                  />
                  <span className="pie-legend-label">{LABEL[s.id]}</span>
                  <span className="pie-legend-n">{fmt(s.count)}</span>
                </button>
              </li>
            ))}
        </ul>
      </div>

      <ZoomBar
        onIn={step < SCOPE_ORDER.length - 1 ? () => onScope(SCOPE_ORDER[step + 1]) : undefined}
        onOut={step > 0 ? () => onScope(SCOPE_ORDER[step - 1]) : undefined}
      />
    </main>
  )
}

type Drawn = Slice & { a: number; b: number }
type Label = { id: SliceId; x: number; y: number; n: number; onPaint: boolean; word: boolean; text?: string }

// A wedge holds its number when it's wide enough, and its word under it when wider still.
const ROOM = 0.06
const WORD_ROOM = 0.15
// A slice thinner than this is a sliver: a tap within REACH of it (both in turns) picks it.
const THIN = 0.03
const REACH = 0.015

/** The numbers inside the pie: each slice its own count, where there's room — a number never names another slice. */
function pieLabels(drawn: Drawn[]): Label[] {
  return drawn
    .filter((s) => s.b - s.a >= ROOM)
    .map((s) => {
      const [x, y] = at((s.a + s.b) / 2, R * 0.6)
        .split(' ')
        .map(Number)
      return {
        id: s.id,
        x,
        y,
        n: s.count,
        onPaint: s.id !== 'unpainted' && s.id !== 'ahead',
        word: s.b - s.a >= WORD_ROOM,
      }
    })
}

/** Whole life: one label per half — "days lived" in the middle of the lived side, "days ahead" in the future wedge. */
function halfLabels(drawn: Drawn[], lived: number, livedEnd: number): Label[] {
  const out: Label[] = []
  const point = (turn: number) =>
    at(turn, R * 0.6)
      .split(' ')
      .map(Number)
  if (lived && livedEnd >= ROOM) {
    const [x, y] = point(livedEnd / 2)
    out.push({ id: 'unpainted', x, y, n: lived, onPaint: true, word: true, text: 'days lived' })
  }
  const ahead = drawn.find((s) => s.id === 'ahead')
  if (ahead && ahead.b - ahead.a >= ROOM) {
    const [x, y] = point((ahead.a + ahead.b) / 2)
    out.push({ id: 'ahead', x, y, n: ahead.count, onPaint: false, word: true, text: 'days ahead' })
  }
  return out
}

const pieLabel = (slices: Slice[]) =>
  'A pie of a life: ' + slices.map((s) => `${LABEL[s.id]} ${fmt(s.count)}`).join(', ')
