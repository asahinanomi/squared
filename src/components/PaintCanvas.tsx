import { useEffect, useRef, useState } from 'react'
import { brushTip } from '../lib/brush'
import { plainDate } from '../lib/dates'
import { paintHex, WORD, type Paint } from '../lib/paints'
import { brushSound, brushStop, settleSound, wakeSound } from '../lib/sound'

type Props = {
  /** Color already saved for this day (shown solid until painted over). */
  saved?: Paint
  /** Paint currently on the brush. */
  loaded: Paint | null
  /** First painted later, on this date: shown small under the word, like a journal entry's date. */
  paintedOn?: string
  onDryBrush: () => void
  onFilled: (p: Paint) => void
  /** The quiet word on a blank square: "paint your day" (today) or "paint this day". */
  blank?: string
}

// A quiet word in the middle of the square: what it holds, or that it's waiting.

// Brush diameter as a share of the square: two side-by-side swipes cover it.
const BRUSH = 0.58
// Coverage is tracked on a coarse grid; this much painted counts as filled.
const GRID = 24
const FILLED = 0.88

// Desktop cursor: a little brush whose tip carries the loaded paint; hotspot at the tip.
function brushCursor(tip: string) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40"><g stroke="#141413" stroke-width="1.6" stroke-linejoin="round"><path d="M34 3c2-1.5 4 .5 2.5 2.5L22 21l-3-3z" fill="#8c8c87"/><path d="M19 18l3 3-3.5 4L15 21.5z" fill="#d9d9d4"/><path d="M15 21.5l3.5 3.5C17 31 12 35.5 5 37c-1.5.3-2.3-.7-1.8-2C5.5 28.5 9 23.5 15 21.5z" fill="${tip}"/></g></svg>`
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}") 4 36, crosshair`
}

export function PaintCanvas({ saved, loaded, paintedOn, onDryBrush, onFilled, blank = 'paint your day' }: Props) {
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
  useEffect(() => {
    if (!settling) return
    const t = setTimeout(() => filled.current(settling), 520)
    return () => clearTimeout(t)
  }, [settling])

  return (
    <div className="paint-wrap">
      {/* A stretched canvas: its sides, wrapped round the frame, show below and to the right — in the paint once
          it's painted. Drawn in grey, quieter than the face's ink edge, so the face stays in front. */}
      <svg className="canvas-sides" viewBox="0 0 105 105" preserveAspectRatio="none" aria-hidden="true">
        <path
          d="M100 0 L105 5 L105 105 L5 105 L0 100 L100 100 Z"
          fill={settling ? paintHex(settling) : saved ? paintHex(saved) : '#e9e6dc'}
        />
        <path d="M100 0 L105 5 L105 105 L5 105 L0 100 L100 100 Z" fill="rgba(20, 20, 19, 0.16)" />
        <path d="M100 0 L105 5 L105 105 L5 105 L0 100 M100 100 L105 105" className="canvas-sides-line" />
      </svg>
      <div
        ref={box}
        className={'canvas' + (settling ? ' is-settling' : '')}
        style={saved ? { background: paintHex(saved) } : undefined}
        aria-label={saved ? `Painted ${saved}` : 'Unpainted square'}
      >
        <canvas ref={canvas} className="paint-surface" />
        {settling && <div className="settle" style={{ background: paintHex(settling) }} />}
        {!touched && !settling && (
          <span className={'canvas-word' + (saved ? ' is-painted' : '')} aria-hidden="true">
            {saved ? WORD[saved] : blank}
            {saved && paintedOn && <small className="canvas-painted">painted {plainDate(paintedOn)}</small>}
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
