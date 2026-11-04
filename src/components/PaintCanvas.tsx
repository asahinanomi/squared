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
  /** Marked "out of my hands": soft eraser strokes over the paint; a red one signs "out of my hands", never "regret"
   *  (green and grey keep their word: they never blamed anyone). */
  marked?: boolean
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
const FLOW_MS = 450
const WET_MS = 520 // wet, as painted, while it saves
const DRY_MS = 1700 // then it dries smooth (2400 until Oct 29, 2026: nomi found the wait a little slow)
const SIGN_MS = 60 // the word and its sound, the moment it's filled (nomi, Nov 4, 2026: 1.4s in, people wondered)
const FILLED = 0.9 // most of it painted; the wet paint flows into the gaps left

// Desktop cursor: a little brush whose tip carries the loaded paint; hotspot at the tip.
function brushCursor(tip: string) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40"><g stroke="#141413" stroke-width="1.6" stroke-linejoin="round"><path d="M34 3c2-1.5 4 .5 2.5 2.5L22 21l-3-3z" fill="#8c8c87"/><path d="M19 18l3 3-3.5 4L15 21.5z" fill="#d9d9d4"/><path d="M15 21.5l3.5 3.5C17 31 12 35.5 5 37c-1.5.3-2.3-.7-1.8-2C5.5 28.5 9 23.5 15 21.5z" fill="${tip}"/></g></svg>`
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}") 4 36, crosshair`
}

export function PaintCanvas({
  saved,
  framed,
  marked,
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
  const flowing = useRef(false)
  const moved = useRef<{ x: number; y: number; t: number } | null>(null)
  // The word steps aside once the brush touches the square (a new color is on its way).
  const [touched, setTouched] = useState(false)

  // The breath just ended: the square's word writes itself back in (never on first sight of the square).
  const [breathed, setBreathed] = useState(false)
  useEffect(() => {
    if (breathing) setBreathed(true)
  }, [breathing])

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
    if (settling || flowing.current) return
    if (drying) dry() // a new coat while it dries: it's dry now
    const p = point(e)
    const s = size.current
    e.currentTarget.setPointerCapture(e.pointerId)
    if (p.x < 0 || p.y < 0 || p.x > s || p.y > s) {
      pending.current = p
      return
    }
    if (!loaded) {
      dryTouch()
      return
    }
    begin()
    strokeTo(p)
  }

  // No colour yet: the square says what to do (nomi, Nov 4, 2026: the brush cursor and the colours' hop were missed).
  // On a computer while the cursor is over it; on a phone for a few seconds after a dry touch, with the hop.
  const [askPick, setAskPick] = useState(false)
  const pickTimer = useRef(0)
  const hovering = useRef(false)
  const dryTouch = () => {
    onDryBrush()
    setAskPick(true)
    clearTimeout(pickTimer.current)
    if (!hovering.current) pickTimer.current = window.setTimeout(() => setAskPick(false), 2500)
  }
  useEffect(() => {
    if (loaded) setAskPick(false)
  }, [loaded])
  useEffect(() => () => clearTimeout(pickTimer.current), [])

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
        dryTouch()
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
    if (done >= FILLED && loaded) flow(loaded)
  }

  // Filled: the wet paint flows into the gaps left, in dabs of the same brush (drawn behind the strokes, so they stay
  // as painted), then a last wash behind everything for any speck the dabs missed. Once the square is truly covered,
  // it settles with its sound.
  const flow = (p: Paint) => {
    const c = canvas.current
    const g = c?.getContext('2d')
    const done = () => {
      flowing.current = false
      if (c && g) dryOn(c, g, p)
      setSettling(p)
    }
    if (!c || !g) return done()
    flowing.current = true
    const s = size.current
    const cell = s / GRID
    const tip = brushTip(paintHex(p), (s * BRUSH) / 4)
    // The gaps, in a loose order, so the paint seeps in here and there rather than sweeping.
    const gaps: number[] = []
    covered.current.forEach((v, i) => !v && gaps.push(i))
    gaps.sort(() => Math.random() - 0.5)
    let drawn = 0
    const start = performance.now()
    const step = () => {
      const k = Math.min(1, (performance.now() - start) / FLOW_MS)
      g.save()
      g.globalCompositeOperation = 'destination-over'
      for (; drawn < Math.ceil(gaps.length * k); drawn++) {
        const i = gaps[drawn]
        const x = ((i % GRID) + 0.5) * cell + (Math.random() - 0.5) * cell
        const y = (Math.floor(i / GRID) + 0.5) * cell + (Math.random() - 0.5) * cell
        g.drawImage(tip, x - tip.width / 2, y - tip.height / 2)
      }
      if (k >= 1) {
        g.fillStyle = paintHex(p)
        g.fillRect(0, 0, c.width, c.height)
      }
      g.restore()
      if (k < 1) requestAnimationFrame(step)
      else done()
    }
    requestAnimationFrame(step)
  }

  const cancel = (e: React.PointerEvent) => {
    pending.current = null
    up(e)
  }

  // Once filled, the last-dipped color settles evenly over the square — and is saved once, however often
  // the parent hands down a new onFilled meanwhile.
  const filled = useRef(onFilled)
  filled.current = onFilled
  // The drying, drawn on the canvas itself, frame by frame (CSS filters and fades starting as the colour saves made
  // iPhone redraw the square): the strokes stay as painted for a moment, then soften into the one smooth colour. No
  // darker "wet" step: switching it on in one frame was the blink nomi saw (found in her screen recording).
  const drying$ = useRef(0)
  useEffect(() => () => cancelAnimationFrame(drying$.current), [])
  const dryOn = (c: HTMLCanvasElement, g: CanvasRenderingContext2D, p: Paint) => {
    const strokes = document.createElement('canvas')
    strokes.width = c.width
    strokes.height = c.height
    strokes.getContext('2d')!.drawImage(c, 0, 0)
    const still = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    const start = performance.now()
    const frame = () => {
      const t = (performance.now() - start - WET_MS) / DRY_MS
      const k = still ? 1 : Math.min(1, Math.max(0, t))
      const e = k * k * (3 - 2 * k)
      g.save()
      g.setTransform(1, 0, 0, 1, 0, 0)
      g.globalCompositeOperation = 'copy'
      g.drawImage(strokes, 0, 0)
      g.globalCompositeOperation = 'source-atop'
      g.globalAlpha = e
      g.fillStyle = paintHex(p)
      g.fillRect(0, 0, c.width, c.height)
      g.restore()
      if (k < 1) drying$.current = requestAnimationFrame(frame)
    }
    frame()
  }

  // Saved: the square keeps its strokes and dries (the same square throughout, never rebuilt: a new canvas can show a
  // frame late on iPhone, a blink).
  useEffect(() => {
    if (!settling) return
    // The answer's sound, the moment the paint is down (with the word, signing faint: nomi, Nov 4, 2026).
    const sound = setTimeout(() => settleSound(settling), SIGN_MS)
    const t = setTimeout(() => {
      setDrying(settling)
      filled.current(settling)
      setTouched(false)
      setSettling(null)
    }, 520)
    return () => {
      clearTimeout(sound)
      clearTimeout(t)
    }
  }, [settling])
  // Just filled: the day's word signs the corner at once, faint, together with its sound (the drop, the knock, the
  // sand): the answer arrives as one, right away. Then the paint dries smooth and the word deepens with it, in full ink
  // as the colour settles. Only on the stroke that filled
  // it, never when a painted day opens. Then the strokes are cleared, ready for another coat.
  const [drying, setDrying] = useState<Paint | null>(null)
  const dry = () => {
    cancelAnimationFrame(drying$.current)
    const c = canvas.current
    if (c) c.getContext('2d')!.clearRect(0, 0, c.width, c.height)
    covered.current.fill(0)
    setDrying(null)
  }
  useEffect(() => {
    if (!drying) return
    const t = setTimeout(dry, 3000)
    return () => clearTimeout(t)
  }, [drying]) // eslint-disable-line react-hooks/exhaustive-deps

  // What the square says it is: saved, or just painted and saving.
  const shown = saved ?? settling
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
        {saved && marked && <MarkStrokes />}

        {/* The word: from the moment the paint is down (settling, before it's saved), one element throughout, so it
            never restarts (nomi, Nov 4, 2026: a blur, painted fast while the square still breathed, blinked). */}
        {(!touched || settling) && (
          <span
            className={'canvas-word' + (shown ? ' is-painted' : '')}
            style={shown ? { color: paintDeep(shown) } : undefined}
            aria-hidden="true"
          >
            <span className="canvas-sign">
              <span
                key={!shown && breathing ? 'breath' : 'word'}
                className={
                  'canvas-hand' +
                  (breathed && !breathing && !shown ? ' is-writing' : '') +
                  (marked && shown === 'red' ? ' is-two' : '')
                }
              >
                {shown
                  ? marked && shown === 'red'
                    ? 'out of\nmy hands'
                    : WORD[shown]
                  : askPick && !loaded
                    ? 'pick a colour\nfirst'
                    : breathing
                      ? 'be here'
                      : blank}
              </span>
            </span>
          </span>
        )}
      </div>
      {/* Strokes may start a little outside the square. */}
      <div
        className="paint-reach"
        // The brush only once there's paint on it: until then, the plain pointer.
        style={{ cursor: loaded ? brushCursor(paintHex(loaded)) : 'default' }}
        onPointerEnter={(e) => {
          if (e.pointerType !== 'mouse') return
          hovering.current = true
          if (!loaded && !saved) {
            setAskPick(true)
            onDryBrush() // and the colours hop with it, so the eye goes to them (nomi, Nov 4, 2026)
          }
        }}
        onPointerLeave={(e) => {
          if (e.pointerType !== 'mouse') return
          hovering.current = false
          setAskPick(false)
        }}
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={up}
        onPointerCancel={cancel}
      />
    </div>
  )
}

/** "Out of my hands": three broad, broken strokes in squared's ink, like an eraser rubbed softly across the day (lab 13,
 *  A6). They fade in and out, rough-edged and grainy, so the paint still shows through: the colour stays the answer. */
export function MarkStrokes({ id = 'mark' }: { id?: string }) {
  return (
    <svg className="mark-strokes" viewBox="0 0 156 156" preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <filter id={`${id}-rough`} x="-10%" y="-10%" width="120%" height="120%">
          <feTurbulence type="fractalNoise" baseFrequency="0.09" numOctaves="2" seed="3" />
          <feDisplacementMap in="SourceGraphic" scale="7" />
          <feGaussianBlur stdDeviation="0.6" />
        </filter>
        <filter id={`${id}-grain`}>
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="1" seed="8" result="n" />
          <feColorMatrix in="n" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -1.2 1" result="m" />
          <feComposite in="SourceGraphic" in2="m" operator="in" />
        </filter>
        <linearGradient id={`${id}-fade`} x1="0" y1="1" x2="1" y2="0">
          <stop offset="0" stopColor="#2f2f2b" stopOpacity="0" />
          <stop offset=".25" stopColor="#2f2f2b" stopOpacity=".42" />
          <stop offset=".7" stopColor="#2f2f2b" stopOpacity=".28" />
          <stop offset="1" stopColor="#2f2f2b" stopOpacity="0" />
        </linearGradient>
      </defs>
      <g filter={`url(#${id}-rough)`} fill="none" stroke={`url(#${id}-fade)`} strokeLinecap="round">
        <path filter={`url(#${id}-grain)`} d="M10 70 Q44 50 74 14" strokeWidth="15" />
        <path filter={`url(#${id}-grain)`} d="M18 116 Q70 80 112 18" strokeWidth="18" />
        <path filter={`url(#${id}-grain)`} d="M44 146 Q96 104 146 46" strokeWidth="14" />
      </g>
    </svg>
  )
}
