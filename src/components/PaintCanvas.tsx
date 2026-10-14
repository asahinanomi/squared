import { useEffect, useRef, useState } from 'react'
import { brushTip } from '../lib/brush'
import { paintHex, type Paint } from '../lib/paints'

type Props = {
  /** Color already saved for this day (shown solid until painted over). */
  saved?: Paint
  /** Paint currently on the brush. */
  loaded: Paint | null
  onDryBrush: () => void
  onFilled: (p: Paint) => void
  /** A quick tap in the margin around the square (not a stroke), in page coordinates. */
  onMarginTap?: (clientX: number, clientY: number) => void
}

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

export function PaintCanvas({ saved, loaded, onDryBrush, onFilled, onMarginTap }: Props) {
  const box = useRef<HTMLDivElement>(null)
  const canvas = useRef<HTMLCanvasElement>(null)
  const covered = useRef(new Uint8Array(GRID * GRID))
  const last = useRef<{ x: number; y: number } | null>(null)
  // A press that began in the margin: a stroke once it moves, a tap if it doesn't.
  const pending = useRef<{ x: number; y: number; cx: number; cy: number } | null>(null)
  const size = useRef(0)
  const [settling, setSettling] = useState<Paint | null>(null)

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
    if (settling) return
    const p = point(e)
    const s = size.current
    e.currentTarget.setPointerCapture(e.pointerId)
    if (p.x < 0 || p.y < 0 || p.x > s || p.y > s) {
      pending.current = { ...p, cx: e.clientX, cy: e.clientY }
      return
    }
    if (!loaded) {
      onDryBrush()
      return
    }
    last.current = null
    strokeTo(p)
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
      last.current = null
      strokeTo(start)
    }
    if (!last.current || !loaded) return
    const events = e.nativeEvent.getCoalescedEvents?.() ?? [e.nativeEvent]
    for (const ev of events.length ? events : [e.nativeEvent]) strokeTo(point(ev))
  }

  const up = () => {
    const tap = pending.current
    if (tap) {
      pending.current = null
      onMarginTap?.(tap.cx, tap.cy)
      return
    }
    if (!last.current) return
    last.current = null
    const done = covered.current.reduce((a, b) => a + b, 0) / covered.current.length
    if (done >= FILLED && loaded) setSettling(loaded)
  }

  const cancel = () => {
    pending.current = null
    up()
  }

  // Once filled, the last-dipped color settles evenly over the square.
  useEffect(() => {
    if (!settling) return
    const t = setTimeout(() => onFilled(settling), 520)
    return () => clearTimeout(t)
  }, [settling, onFilled])

  return (
    <div className="paint-wrap">
      <div
        ref={box}
        className="canvas"
        style={saved ? { background: paintHex(saved) } : undefined}
        aria-label={saved ? `Painted ${saved}` : 'Unpainted square'}
      >
        <canvas ref={canvas} className="paint-surface" />
        {settling && <div className="settle" style={{ background: paintHex(settling) }} />}
      </div>
      {/* Strokes may start a little outside the square; a quick tap here reaches the grid day beneath. */}
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
