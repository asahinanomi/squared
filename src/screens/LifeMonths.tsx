import { useLayoutEffect, useMemo, useRef, useState } from 'react'
import { glide } from '../lib/backToToday'
import { LifeHead, type Resolution } from '../components/LifeHead'
import { ZoomBar } from '../components/ZoomBar'
import { isoDate, todayIso } from '../lib/dates'
import type { Days } from '../lib/days'
import type { Profile } from '../lib/profile'
import { bands, monthEnd, type Band } from '../lib/tally'
import { fitText, roundRect, useCanvasList } from '../lib/useCanvasList'
import type { Focal } from '../lib/usePinch'

type Props = {
  days: Days
  profile: Profile
  /** Open a month's days. */
  onPick: (monthIso: string) => void
  /** Zoom in: this year. */
  onIn: () => void
  onResolution: (r: Resolution) => void
  /** Zoom out: a life in days. */
  onOut: () => void
  /** Squares per row: 12 (a row is a year), or fewer and bigger when pinched in (6, 4, 3). */
  cols?: number
  /** Where the fingers were when the size changed: the square under them stays put. */
  focal?: Focal
}

// Space between squares grows with them, so big squares stay apart.
const gapFor = (n: number) => ({ 12: 4, 6: 7, 4: 9, 3: 10 })[n] ?? 4
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const LIVED_BLANK = '#eeeee8'
const AHEAD = '#f1f1ec'
const BEFORE = '#f6f6f2'
const INK = '#141413'
const LABEL_COLS = 3 // only at the deepest zoom do squares print their name and year (if it fits)
const PULSE_MS = 900
const FONT = "'Schibsted Grotesk', system-ui, sans-serif"

// A life, in months — about 1,140 banded month-squares, twelve to a row so each row is a year,
// read top to bottom. Drawn on a canvas (only the rows on screen), opening on this month.
export function LifeMonths({ days, profile, onPick, onIn, onResolution, onOut, cols = 12, focal }: Props) {
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
          if (cols === LABEL_COLS && key >= bornMonth) {
            // Clipped to the square, centred, and drawn only if it fits: a label never spills over.
            ctx.save()
            roundRect(ctx, x, y, cell, cell, radius)
            ctx.clip()
            ctx.textAlign = 'center'
            ctx.fillStyle = lived ? '#24241f' : '#bfbfb8'
            const maxW = cell * 0.84
            ctx.font = `600 ${Math.round(cell * 0.2)}px ${FONT}`
            fitText(ctx, MONTHS[m], x + cell / 2, y + cell / 2, maxW)
            ctx.font = `400 ${Math.round(cell * 0.15)}px ${FONT}`
            fitText(ctx, String(year), x + cell / 2, y + cell / 2 + cell * 0.2, maxW)
            ctx.restore()
          }
          if (key === thisMonth) {
            roundRect(ctx, x - 2, y - 2, cell + 4, cell + 4, radius + 2)
            ctx.lineWidth = 2
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
    // Open with this month's row in the middle.
    (w, h) => {
      const { cell, pitch } = geometry(w)
      const i = (Number(thisMonth.slice(0, 4)) - firstYear) * 12 + Number(thisMonth.slice(5, 7)) - 1
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

  return (
    <main className="life">
      <LifeHead profile={profile} current="months" onPick={onResolution} />
      <div
        className="life-canvas"
        ref={scroller}
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
        hint={
          cols === LABEL_COLS
            ? 'zoomed in — each month shows its name & year'
            : 'each square a month · scroll for your whole life'
        }
        onIn={onIn}
        onOut={onOut}
        onToday={away ? backToToday : undefined}
      />
    </main>
  )
}
