import { useEffect, useLayoutEffect, useMemo, useRef, useState, type MutableRefObject } from 'react'
import { glide } from '../lib/backToToday'
import { LifeHead, type Resolution } from '../components/LifeHead'
import { ZoomBar } from '../components/ZoomBar'
import { isoDate, todayIso } from '../lib/dates'
import type { Days } from '../lib/days'
import type { Profile } from '../lib/profile'
import { bands, monthEnd, type Band } from '../lib/tally'
import { MIN_TEXT_PX, roundRect, textFits, useCanvasList } from '../lib/useCanvasList'
import type { Focal } from '../lib/usePinch'

type Props = {
  days: Days
  profile: Profile
  /** Open a month's days. */
  onPick: (monthIso: string) => void
  /** Zoom in: this month. */
  onIn: () => void
  onResolution: (r: Resolution) => void
  /** Zoom out: a life in days. */
  onOut?: () => void
  /** Squares per row: 12 (a row is a year), or fewer and bigger when pinched in (6, 4, 3). */
  cols?: number
  /** Where the fingers were when the size changed: the square under them stays put. */
  focal?: Focal
  /** The month to open on (from another tab or the list), else this month. */
  focus?: string
  /** Kept up to date with the month in the middle of the screen, for a tab or a switch to open there. */
  mid?: MutableRefObject<() => string>
}

// Space between squares grows with them, so big squares stay apart.
const gapFor = (n: number) => ({ 12: 4, 6: 7, 4: 9, 3: 10 })[n] ?? 4
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const LIVED_BLANK = '#e2e2da' // lived, not painted: a shade deeper than the months ahead
const AHEAD = '#f1f1ec'
const BEFORE = '#f6f6f2'
const INK = '#141413'
const PULSE_MS = 900
const FONT = "'Inter', system-ui, sans-serif"

// A life, in months — about 1,140 banded month-squares, twelve to a row so each row is a year,
// read top to bottom. Drawn on a canvas (only the rows on screen), opening on this month.
export function LifeMonths({ days, profile, onPick, onIn, onResolution, onOut, cols = 12, focal, focus, mid }: Props) {
  const today = todayIso()
  const { born, lifespan } = profile
  const firstYear = Number(born.slice(0, 4))
  const count = lifespan * 12 // every month of the life, from the January of the birth year
  const rows = Math.ceil(count / cols)
  const thisMonth = today.slice(0, 7)
  const bornMonth = born.slice(0, 7)
  const [away, setAway] = useState(false) // this month scrolled out of view
  const pulseAt = useRef(-1e9) // when this month's square last pulsed

  // Bands for each lived month, worked out once per change in your days.
  const monthBands = useMemo(() => {
    const cache = new Map<string, Band[]>()
    return (key: string) => {
      let b = cache.get(key)
      if (!b) {
        const first = `${key}-01`
        b = bands(days, first, monthEnd(first), today, born)
        cache.set(key, b)
      }
      return b
    }
  }, [days, today, born])

  // A square prints "Oct" over "2026" as soon as both fit inside it at a readable size.
  const nameFont = (cell: number) => `600 ${Math.max(MIN_TEXT_PX + 1, Math.round(cell * 0.2))}px ${FONT}`
  const yearFont = (cell: number) => `400 ${Math.max(MIN_TEXT_PX, Math.round(cell * 0.15))}px ${FONT}`
  const labelled = (cell: number) =>
    cell >= 40 && textFits('May', nameFont(cell), cell * 0.84) && textFits('2026', yearFont(cell), cell * 0.84)

  const geometry = (w: number, n = cols) => {
    const gap = gapFor(n)
    const cell = (w - gap * (n - 1)) / n
    return { cell, pitch: cell + gap, gap }
  }

  const { scroller, canvas, size, onScroll } = useCanvasList(
    (ctx, top, w, h) => {
      const { cell, pitch } = geometry(w)
      const r0 = Math.max(0, Math.floor(top / pitch) - 1)
      const r1 = Math.min(rows - 1, Math.ceil((top + h) / pitch) + 1)
      const radius = Math.min(9, Math.max(3, cell * 0.12))
      const showLabels = labelled(cell)
      for (let r = r0; r <= r1; r++) {
        for (let c = 0; c < cols; c++) {
          const i = r * cols + c
          if (i >= count) break
          const year = firstYear + Math.floor(i / 12)
          const m = i % 12
          const x = c * pitch
          const y = r * pitch - top
          const key = `${year}-${String(m + 1).padStart(2, '0')}`
          const lived = key >= bornMonth && key <= thisMonth
          ctx.save()
          roundRect(ctx, x, y, cell, cell, radius)
          ctx.clip()
          ctx.fillStyle = key < bornMonth ? BEFORE : key > thisMonth ? AHEAD : LIVED_BLANK
          ctx.fillRect(x, y, cell, cell)
          if (lived) {
            // Rising bands: green from the bottom, then grey, then red.
            let yb = y + cell
            for (const b of monthBands(key)) {
              const bh = b.share * cell
              ctx.fillStyle = b.fill
              ctx.fillRect(x, yb - bh, cell, bh + 0.5)
              yb -= bh
            }
          }
          ctx.restore()
          if (showLabels && key >= bornMonth) {
            ctx.textAlign = 'center'
            ctx.fillStyle = lived ? '#24241f' : '#bfbfb8'
            ctx.font = nameFont(cell)
            ctx.fillText(MONTHS[m], x + cell / 2, y + cell / 2)
            ctx.font = yearFont(cell)
            ctx.fillText(String(year), x + cell / 2, y + cell / 2 + Math.max(cell * 0.2, MIN_TEXT_PX + 4))
          }
          if (key === thisMonth) {
            // This month's edge in ink, inside its square (as everywhere).
            const w = Math.min(2, cell / 4)
            roundRect(ctx, x + w / 2, y + w / 2, cell - w, cell - w, Math.max(0, radius - w / 2))
            ctx.lineWidth = w
            ctx.strokeStyle = INK
            ctx.stroke()
            // Just came back to today: a ring that grows and fades.
            const p = (performance.now() - pulseAt.current) / PULSE_MS
            if (p >= 0 && p < 1) {
              const g = 3 + 10 * p
              roundRect(ctx, x - g, y - g, cell + g * 2, cell + g * 2, radius + g)
              ctx.lineWidth = 2
              ctx.strokeStyle = `rgba(20, 20, 19, ${0.4 * (1 - p)})`
              ctx.stroke()
            }
          }
        }
      }
    },
    // Open with the focus month's row (else this month's) in the middle.
    (w, h) => {
      const { cell, pitch } = geometry(w)
      const at = focus && focus.slice(0, 7) >= bornMonth && focus.slice(0, 7) <= thisMonth ? focus : thisMonth
      const i = (Number(at.slice(0, 4)) - firstYear) * 12 + Number(at.slice(5, 7)) - 1
      return Math.floor(i / cols) * pitch - (h - cell) / 2
    },
  )

  const { cell, pitch } = size.w ? geometry(size.w) : { cell: 0, pitch: 0 }

  // After a pinch changes the size, keep the square that was under the fingers under them.
  const prevCols = useRef(cols)
  // Read the scroll position before this render's layout lands: a smaller layout would clamp it.
  const topBefore = useRef(0)
  topBefore.current = scroller.current?.scrollTop ?? 0
  useLayoutEffect(() => {
    const el = scroller.current
    const was = prevCols.current
    prevCols.current = cols
    if (!el || !size.w || was === cols) return
    const box = el.getBoundingClientRect()
    const fy = focal ? focal.y - box.top : el.clientHeight / 2
    const fx = focal ? focal.x - box.left : el.clientWidth / 2
    const old = geometry(size.w, was)
    const i = Math.floor((topBefore.current + fy) / old.pitch) * was + Math.min(was - 1, Math.floor(fx / old.pitch))
    el.scrollTop = Math.floor(i / cols) * pitch + cell / 2 - fy
  }, [cols]) // eslint-disable-line react-hooks/exhaustive-deps

  // "today": glide back to this month's square on this same screen, then pulse it.
  const nowTop = () => {
    const i = (Number(thisMonth.slice(0, 4)) - firstYear) * 12 + Number(thisMonth.slice(5, 7)) - 1
    return Math.floor(i / cols) * pitch
  }
  const checkAway = () => {
    const el = scroller.current
    if (!el || !cell) return
    const y = nowTop()
    setAway(y + cell < el.scrollTop || y > el.scrollTop + el.clientHeight)
  }
  const backToToday = () => {
    const el = scroller.current
    if (!el) return
    glide(el, nowTop() - (el.clientHeight - cell) / 2, () => {
      pulseAt.current = performance.now()
      const tick = () => {
        onScroll() // repaint
        if (performance.now() - pulseAt.current < PULSE_MS + 50) requestAnimationFrame(tick)
      }
      tick()
    })
  }

  const onTap = (e: React.MouseEvent) => {
    const el = scroller.current
    if (!el || !cell) return
    const box = el.getBoundingClientRect()
    const x = e.clientX - box.left
    const y = e.clientY - box.top + el.scrollTop
    const c = Math.floor(x / pitch)
    const r = Math.floor(y / pitch)
    if (c < 0 || c >= cols || r < 0 || r >= rows) return
    if (x - c * pitch > cell || y - r * pitch > cell) return // in a gap
    const i = r * cols + c
    if (i >= count) return
    const first = isoDate(new Date(firstYear + Math.floor(i / 12), i % 12, 1))
    if (first.slice(0, 7) < bornMonth || first.slice(0, 7) > thisMonth) return
    onPick(first)
  }

  // The month in the middle of the screen (until you move, the one it opened on), for a tab or the list.
  const moved = useRef(false)
  const middle = () => {
    const el = scroller.current
    if (!moved.current || !el || !pitch) return focus ?? today
    const i = Math.floor((el.scrollTop + el.clientHeight / 2) / pitch) * cols + Math.floor(cols / 2)
    const d = isoDate(new Date(firstYear + Math.floor(i / 12), i % 12, 1))
    return d > today ? today : d < born ? born : d
  }
  if (mid) mid.current = middle
  useEffect(() => () => void (mid && (mid.current = todayIso)), [mid])

  return (
    <main className="life">
      <LifeHead profile={profile} current="months" onPick={onResolution} />
      <div
        className="life-canvas"
        ref={scroller}
        onPointerDown={() => (moved.current = true)}
        onWheel={() => (moved.current = true)}
        onScroll={() => {
          onScroll()
          checkAway()
        }}
        onClick={onTap}
      >
        <canvas ref={canvas} style={{ width: size.w, height: size.h }} aria-hidden="true" />
        <div style={{ height: Math.max(0, rows * pitch - gapFor(cols) - size.h) }} />
      </div>
      <ZoomBar
        onIn={onIn}
        onOut={onOut}
        onRecenter={away ? backToToday : undefined}
        listAt={() => {
          // Today's month on screen right now (not the last scroll's guess: a life opened on a past month never scrolled)?
          const el = scroller.current
          const y = nowTop()
          const seen = !!el && !!cell && y + cell >= el.scrollTop && y <= el.scrollTop + el.clientHeight
          return seen ? today : middle()
        }}
      />
    </main>
  )
}
