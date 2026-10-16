import { useMemo } from 'react'
import { LifeHead, type Resolution } from '../components/LifeHead'
import { ZoomBar } from '../components/ZoomBar'
import { isoDate, todayIso } from '../lib/dates'
import type { Days } from '../lib/days'
import type { Profile } from '../lib/profile'
import { bands, monthEnd, type Band } from '../lib/tally'
import { roundRect, useCanvasList } from '../lib/useCanvasList'

type Props = {
  days: Days
  profile: Profile
  /** Open a month's days. */
  onPick: (monthIso: string) => void
  /** Zoom in: this year. */
  onIn: () => void
  onResolution: (r: Resolution) => void
}

const COLS = 12 // each row is one calendar year, Jan–Dec
const GAP = 4
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const LIVED_BLANK = '#eeeee8'
const AHEAD = '#f1f1ec'
const BEFORE = '#f6f6f2'
const INK = '#141413'
const LABEL_MIN = 44 // squares at least this big print their name and year
const FONT = "'Schibsted Grotesk', system-ui, sans-serif"

// A life, in months — about 1,140 banded month-squares, twelve to a row so each row is a year,
// read top to bottom. Drawn on a canvas (only the rows on screen), opening on this month.
export function LifeMonths({ days, profile, onPick, onIn, onResolution }: Props) {
  const today = todayIso()
  const { born, lifespan } = profile
  const firstYear = Number(born.slice(0, 4))
  const rows = lifespan
  const thisMonth = today.slice(0, 7)
  const bornMonth = born.slice(0, 7)

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

  const geometry = (w: number) => {
    const cell = (w - GAP * (COLS - 1)) / COLS
    return { cell, pitch: cell + GAP }
  }

  const { scroller, canvas, size, onScroll } = useCanvasList(
    (ctx, top, w, h) => {
      const { cell, pitch } = geometry(w)
      const r0 = Math.max(0, Math.floor(top / pitch) - 1)
      const r1 = Math.min(rows - 1, Math.ceil((top + h) / pitch) + 1)
      const radius = Math.min(9, Math.max(3, cell * 0.12))
      for (let r = r0; r <= r1; r++) {
        const year = firstYear + r
        for (let c = 0; c < COLS; c++) {
          const x = c * pitch
          const y = r * pitch - top
          const key = `${year}-${String(c + 1).padStart(2, '0')}`
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
          if (cell >= LABEL_MIN && key >= bornMonth) {
            ctx.textAlign = 'center'
            ctx.fillStyle = lived ? '#24241f' : '#bfbfb8'
            ctx.font = `600 ${Math.round(cell * 0.2)}px ${FONT}`
            ctx.fillText(MONTHS[c], x + cell / 2, y + cell / 2)
            ctx.font = `400 ${Math.round(cell * 0.15)}px ${FONT}`
            ctx.fillText(String(year), x + cell / 2, y + cell / 2 + cell * 0.2)
          }
          if (key === thisMonth) {
            roundRect(ctx, x - 2, y - 2, cell + 4, cell + 4, radius + 2)
            ctx.lineWidth = 2
            ctx.strokeStyle = INK
            ctx.stroke()
          }
        }
      }
    },
    // Open with this month's row in the middle.
    (w, h) => {
      const { cell, pitch } = geometry(w)
      return (Number(thisMonth.slice(0, 4)) - firstYear) * pitch - (h - cell) / 2
    },
  )

  const { cell, pitch } = size.w ? geometry(size.w) : { cell: 0, pitch: 0 }

  const onTap = (e: React.MouseEvent) => {
    const el = scroller.current
    if (!el || !cell) return
    const box = el.getBoundingClientRect()
    const x = e.clientX - box.left
    const y = e.clientY - box.top + el.scrollTop
    const c = Math.floor(x / pitch)
    const r = Math.floor(y / pitch)
    if (c < 0 || c >= COLS || r < 0 || r >= rows) return
    if (x - c * pitch > cell || y - r * pitch > cell) return // in a gap
    const key = `${firstYear + r}-${String(c + 1).padStart(2, '0')}`
    if (key < bornMonth || key > thisMonth) return
    onPick(isoDate(new Date(firstYear + r, c, 1)))
  }

  return (
    <main className="life">
      <LifeHead profile={profile} current="months" onPick={onResolution} />
      <div className="life-canvas" ref={scroller} onScroll={onScroll} onClick={onTap}>
        <canvas ref={canvas} style={{ width: size.w, height: size.h }} aria-hidden="true" />
        <div style={{ height: Math.max(0, rows * pitch - 4 - size.h) }} />
      </div>
      <ZoomBar hint="each square a month · scroll for your whole life" onIn={onIn} />
    </main>
  )
}
