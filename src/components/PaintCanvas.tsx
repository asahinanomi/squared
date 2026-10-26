import { useEffect, useRef, useState } from 'react'
import { brushTip } from '../lib/brush'
import { frameVars, paintDeep, paintHex, WORD, type Paint } from '../lib/paints'
import { brushSound, brushStop, settleSound, wakeSound } from '../lib/sound'

type Props = {
  /** Color already saved for this day (shown solid until painted over). */
  saved?: Paint
  /** Paint currently on the brush. */
  loaded: Paint | null
  /** A day that mattered most: its edge drawn in a darker green, thicker. */
  framed?: boolean
  onDryBrush: () => void
  onFilled: (p: Paint) => void
  /** The quiet word on a blank square: "paint your day" (today) or "paint this day". */
  blank?: string
  /** The day's first dip: the canvas breathes once ("be here"). */
  breathing?: boolean
}

// A quiet word in the middle of the square: what it holds, or that it's waiting.

// Brush diameter as a share of the square: two side-by-side swipes cover it.
const BRUSH = 0.58
// Coverage is tracked on a coarse grid; this much painted counts as filled.
const GRID = 24
const FILLED = 0.88

// When a square last filled (performance.now()): the square that mounts with the saved colour picks the drying up.
let filledAt = -1e9

// The ghost brush's stroke: two sweeps across the square, each rising from left to right, like painting it.
const GHOST = 'M18 46 L82 28 L18 68 L82 50'

// Every blank square, once, as it appears: a ghost brush sweeps the stroke, leaving a faint trail that fades, so the
// square reads as "paint me". Moved by script (SVG's own animation clock can start at page load); in step with the
// CSS: 0.4s in, a 0.85s sweep (the calm pace, over a shorter stroke).
function GhostBrush() {
  const trail = useRef<SVGPathElement>(null)
  const brush = useRef<SVGGElement>(null)
  useEffect(() => {
    const path = trail.current
    const g = brush.current
    if (!path || !g) return
    const total = path.getTotalLength()
    const start = performance.now()
    let raf = 0
    const tick = (now: number) => {
      const k = Math.min(1, Math.max(0, (now - start - 400) / 850))
      const pt = path.getPointAtLength(k * total)
      g.setAttribute('transform', `translate(${pt.x} ${pt.y})`)
      if (k < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])
  return (
    <svg className="ghost" viewBox="0 0 100 100" aria-hidden="true">
      <path ref={trail} className="ghost-trail" pathLength="1" d={GHOST} />
      <g ref={brush} className="ghost-brush" transform="translate(18 40)">
        <path d="M30 -27c2-1.5 4 .5 2.5 2.5L18 -9l-3-3z" fill="#8c8c87" />
        <path d="M15 -12l3 3-3.5 4L11 -8.5z" fill="#d9d9d4" />
        <path d="M11 -8.5l3.5 3.5C13 1 8 5.5 1 7c-1.5.3-2.3-.7-1.8-2C1.5-1.5 5-6.5 11-8.5z" fill="#6e9b7b" />
      </g>
    </svg>
  )
}

// Desktop cursor: a little brush whose tip carries the loaded paint; hotspot at the tip.
function brushCursor(tip: string) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40"><g stroke="#141413" stroke-width="1.6" stroke-linejoin="round"><path d="M34 3c2-1.5 4 .5 2.5 2.5L22 21l-3-3z" fill="#8c8c87"/><path d="M19 18l3 3-3.5 4L15 21.5z" fill="#d9d9d4"/><path d="M15 21.5l3.5 3.5C17 31 12 35.5 5 37c-1.5.3-2.3-.7-1.8-2C5.5 28.5 9 23.5 15 21.5z" fill="${tip}"/></g></svg>`
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}") 4 36, crosshair`
}

export function PaintCanvas({
  saved,
  framed,
  loaded,
  onDryBrush,
  onFilled,
  blank = 'paint your day',
  breathing,
}: Props) {
  const box = useRef<HTMLDivElement>(null)
  const canvas = useRef<HTMLCanvasElement>(null)
  const covered = useRef(new Uint8Array(GRID * GRID))
  const last = useRef<{ x: number; y: number } | null>(null)
  // A press that began in the margin: a stroke once it moves; a tap there does nothing.
  const pending = useRef<{ x: number; y: number } | null>(null)
  const size = useRef(0)
  // Fingers on the square, and the paint as it was before this stroke: a second finger means a
  // pinch (zooming out), so the stroke the first finger began is taken back.
  const fingers = useRef(new Set<number>())
  const before = useRef<{ img: ImageData; covered: Uint8Array } | null>(null)
  const [settling, setSettling] = useState<Paint | null>(null)
  const moved = useRef<{ x: number; y: number; t: number } | null>(null)
  // The word steps aside once the brush touches the square (a new color is on its way).
  const [touched, setTouched] = useState(false)

  // Just framed: a soft light sweeps once across the canvas (never on unframing, or on opening a framed day).
  const [shining, setShining] = useState(false)
  const wasFramed = useRef(framed)
  useEffect(() => {
    if (framed && !wasFramed.current) {
      setShining(true)
      const t = setTimeout(() => setShining(false), 1200)
      wasFramed.current = framed
      return () => clearTimeout(t)
    }
    wasFramed.current = framed
  }, [framed])

  // Size the backing store to the element at device resolution.
  useEffect(() => {
    const el = box.current!
    const fit = () => {
      const c = canvas.current
      if (!c) return
      const s = el.clientWidth
      const dpr = window.devicePixelRatio || 1
      size.current = s
      c.width = c.height = Math.round(s * dpr)
      c.getContext('2d')!.setTransform(dpr, 0, 0, dpr, 0, 0)
      covered.current.fill(0)
    }
    fit()
    const ro = new ResizeObserver(fit)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const point = (e: PointerEvent | React.PointerEvent) => {
    const r = canvas.current!.getBoundingClientRect()
    return { x: e.clientX - r.left, y: e.clientY - r.top }
  }

  const dab = (x: number, y: number) => {
    const s = size.current
    const radius = (s * BRUSH) / 2
    const ctx = canvas.current!.getContext('2d')!
    const tip = brushTip(paintHex(loaded!), radius)
    ctx.drawImage(tip, x - tip.width / 2, y - tip.height / 2)

    // Mark grid cells under the brush body as covered.
    const reach = radius * 0.85
    const cell = s / GRID
    const c0 = Math.max(0, Math.floor((x - reach) / cell))
    const c1 = Math.min(GRID - 1, Math.floor((x + reach) / cell))
    const r0 = Math.max(0, Math.floor((y - reach) / cell))
    const r1 = Math.min(GRID - 1, Math.floor((y + reach) / cell))
    for (let r = r0; r <= r1; r++)
      for (let c = c0; c <= c1; c++) {
        const dx = (c + 0.5) * cell - x
        const dy = (r + 0.5) * cell - y
        if (dx * dx + dy * dy <= reach * reach) covered.current[r * GRID + c] = 1
      }
  }

  const strokeTo = (p: { x: number; y: number }) => {
    const from = last.current ?? p
    const step = Math.max(1.5, size.current * 0.012)
    const dist = Math.hypot(p.x - from.x, p.y - from.y)
    const n = Math.max(1, Math.ceil(dist / step))
    for (let i = 1; i <= n; i++) dab(from.x + ((p.x - from.x) * i) / n, from.y + ((p.y - from.y) * i) / n)
    last.current = p
  }

  const down = (e: React.PointerEvent) => {
    // The first finger of a new touch: forget any finger whose lift was never seen (it would read as a pinch).
    if (e.isPrimary) fingers.current.clear()
    fingers.current.add(e.pointerId)
    if (fingers.current.size > 1) {
      // A pinch, not a stroke: undo what the first finger painted.
      const b = before.current
      if (b && last.current) {
        canvas.current!.getContext('2d')!.putImageData(b.img, 0, 0)
        covered.current.set(b.covered)
        // Nothing left on the square: the word comes back.
        if (!b.covered.some(Boolean)) setTouched(false)
      }
      last.current = null
      pending.current = null
      brushStop()
      return
    }
    if (settling) return
    const p = point(e)
    const s = size.current
    e.currentTarget.setPointerCapture(e.pointerId)
    if (p.x < 0 || p.y < 0 || p.x > s || p.y > s) {
      pending.current = p
      return
    }
    if (!loaded) {
      onDryBrush()
      return
    }
    begin()
    strokeTo(p)
  }

  const begin = () => {
    wakeSound()
    moved.current = null
    const c = canvas.current!
    before.current = {
      img: c.getContext('2d')!.getImageData(0, 0, c.width, c.height),
      covered: covered.current.slice(),
    }
    last.current = null
    setTouched(true)
  }

  const move = (e: React.PointerEvent) => {
    const start = pending.current
    if (start) {
      const p = point(e)
      if (Math.hypot(p.x - start.x, p.y - start.y) < 8) return
      pending.current = null
      if (!loaded) {
        onDryBrush()
        return
      }
      begin()
      strokeTo(start)
    }
    if (!last.current || !loaded) return
    const events = e.nativeEvent.getCoalescedEvents?.() ?? [e.nativeEvent]
    for (const ev of events.length ? events : [e.nativeEvent]) strokeTo(point(ev))
    // The bristles' sound follows the brush's speed (in squares per second).
    const p = point(e)
    const prev = moved.current
    if (prev) {
      const dt = Math.max(1, e.timeStamp - prev.t) / 1000
      brushSound(Math.hypot(p.x - prev.x, p.y - prev.y) / size.current / dt)
    }
    moved.current = { ...p, t: e.timeStamp }
  }

  const up = (e?: React.PointerEvent) => {
    if (e) fingers.current.delete(e.pointerId)
    if (fingers.current.size > 0) return
    if (pending.current) {
      pending.current = null
      return
    }
    if (!last.current) return
    last.current = null
    brushStop()
    wakeSound() // iPhone allows sound from a lifted finger, if the touch-down was too early
    const done = covered.current.reduce((a, b) => a + b, 0) / covered.current.length
    if (done >= FILLED && loaded) {
      setSettling(loaded)
      settleSound(loaded)
    }
  }

  const cancel = (e: React.PointerEvent) => {
    pending.current = null
    up(e)
  }

  // Once filled, the last-dipped color settles evenly over the square — and is saved once, however often
  // the parent hands down a new onFilled meanwhile.
  const filled = useRef(onFilled)
  filled.current = onFilled
  // Then the square is ready for the next coat. A new colour remounts it anyway; the same colour again
  // (dipped back to what it already holds) keeps it, so it must clear itself or it would never take paint again.
  useEffect(() => {
    if (!settling) return
    const t = setTimeout(() => {
      filledAt = performance.now()
      setDrying(true)
      filled.current(settling)
      const c = canvas.current
      if (c) c.getContext('2d')!.clearRect(0, 0, c.width, c.height)
      covered.current.fill(0)
      setTouched(false)
      setSettling(null)
    }, 520)
    return () => clearTimeout(t)
  }, [settling])
  // Just filled: the paint is still wet (a soft sheen, a shade deeper), then it dries matte and the day's word signs
  // the corner. Only on the stroke that filled it, never when a painted day opens. Saving a new colour remounts the
  // square, so the moment it filled is kept outside it.
  const [drying, setDrying] = useState(() => performance.now() - filledAt < 400)
  useEffect(() => {
    if (!drying) return
    const t = setTimeout(() => setDrying(false), 4000)
    return () => clearTimeout(t)
  }, [drying])

  return (
    <div className="paint-wrap">
      <div
        ref={box}
        className={
          'canvas' +
          (settling ? ' is-settling' : '') +
          (drying ? ' is-drying' : '') +
          (framed && saved ? ' is-framed' : '') +
          (shining ? ' is-shining' : '') +
          (breathing && !saved ? ' is-breathing' : '')
        }
        style={saved ? frameVars(saved) : undefined}
        aria-label={saved ? `Painted ${saved}` : 'Unpainted square'}
      >
        {/* The primed face, inside a thin raw-canvas margin where the priming stops: weave while blank, the
            day's paint once painted. Strokes and the settle stay inside it too. */}
        <div className={'canvas-face' + (saved ? ' is-painted' : '')} />
        <canvas ref={canvas} className="paint-surface" />

        {settling && <div className="settle" style={{ background: paintHex(settling) }} />}
        {drying && <div className="wet-sheen" />}
        {/* For someone new: a ghost brush sweeps across, leaving a faint trail, so the square reads as "paint me". */}
        {!saved && !touched && <GhostBrush />}
        {!touched && !settling && (
          <span
            className={'canvas-word' + (saved ? ' is-painted' : '')}
            style={saved ? { color: paintDeep(saved) } : undefined}
            aria-hidden="true"
          >
            <span className="canvas-sign">
              <span className="canvas-hand">{saved ? WORD[saved] : breathing ? 'be here' : blank}</span>
            </span>
          </span>
        )}
      </div>
      {/* Strokes may start a little outside the square. */}
      <div
        className="paint-reach"
        style={{ cursor: brushCursor(loaded ? paintHex(loaded) : '#f4f4f1') }}
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={up}
        onPointerCancel={cancel}
      />
    </div>
  )
}
