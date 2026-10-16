import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { LifeHead, type Resolution } from '../components/LifeHead'
import { ZoomBar } from '../components/ZoomBar'
import { isoDate, todayIso } from '../lib/dates'
import type { Days } from '../lib/days'
import type { Profile } from '../lib/profile'
import { bands, monthEnd, type Band } from '../lib/tally'

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

// A life, in months — about 1,140 banded month-squares, twelve to a row so each row is a year,
// read top to bottom. Drawn on a canvas (only the rows on screen), opening on this month.
export function LifeMonths({ days, profile, onPick, onIn, onResolution }: Props) {
  const today = todayIso()
  const { born, lifespan } = profile
  const firstYear = Number(born.slice(0, 4))
  const rows = lifespan
  const thisMonth = today.slice(0, 7)
  const bornMonth = born.slice(0, 7)

  const scroller = useRef<HTMLDivElement>(null)
  const canvas = useRef<HTMLCanvasElement>(null)
  const [size, setSize] = useState({ w: 0, h: 0 })

  // Bands for each lived month, worked out once per change in your days.
  // eslint-disable-next-line react-hooks/exhaustive-deps -- a fresh cache whenever the days change
  const cache = useMemo(() => new Map<string, Band[]>(), [days])
  const monthBands = useCallback(
    (key: string) => {
      let b = cache.get(key)
      if (!b) {
        const first = `${key}-01`
        b = bands(days, first, monthEnd(first), today, born)
        cache.set(key, b)
      }
      return b
    },
    [cache, days, today, born],
  )

  const cell = size.w ? (size.w - GAP * (COLS - 1)) / COLS : 0
  const pitch = cell + GAP
  const totalH = rows * pitch - GAP

  const draw = useCallback(() => {
    const cv = canvas.current
    const el = scroller.current
    if (!cv || !el || !cell) return
    const dpr = window.devicePixelRatio || 1
    const ctx = cv.getContext('2d')!
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.clearRect(0, 0, size.w, size.h)
    const top = el.scrollTop
    const r0 = Math.max(0, Math.floor(top / pitch) - 1)
    const r1 = Math.min(rows - 1, Math.ceil((top + size.h) / pitch) + 1)
    const radius = Math.min(9, Math.max(3, cell * 0.12))
    for (let r = r0; r <= r1; r++) {
      const year = firstYear + r
      for (let c = 0; c < COLS; c++) {
        const x = c * pitch
        const y = r * pitch - top
        const key = `${year}-${String(c + 1).padStart(2, '0')}`
        ctx.save()
        ctx.beginPath()
        ctx.roundRect(x, y, cell, cell, radius)
        ctx.clip()
        if (key < bornMonth) ctx.fillStyle = BEFORE
        else if (key > thisMonth) ctx.fillStyle = AHEAD
        else ctx.fillStyle = LIVED_BLANK
        ctx.fillRect(x, y, cell, cell)
        if (key >= bornMonth && key <= thisMonth) {
          // Rising bands: green from the bottom, then grey, then red.
          let yb = y + cell
          for (const b of monthBands(key)) {
            const h = b.share * cell
            ctx.fillStyle = b.fill
            ctx.fillRect(x, yb - h, cell, h + 0.5)
            yb -= h
          }
        }
        ctx.restore()
        if (cell >= LABEL_MIN && key >= bornMonth) {
          const lived = key <= thisMonth
          ctx.textAlign = 'center'
          ctx.fillStyle = lived ? '#24241f' : '#bfbfb8'
          ctx.font = `600 ${Math.round(cell * 0.2)}px 'Schibsted Grotesk', system-ui, sans-serif`
          ctx.fillText(MONTHS[c], x + cell / 2, y + cell / 2)
          ctx.font = `400 ${Math.round(cell * 0.15)}px 'Schibsted Grotesk', system-ui, sans-serif`
          ctx.fillText(String(year), x + cell / 2, y + cell / 2 + cell * 0.2)
        }
        if (key === thisMonth) {
          ctx.beginPath()
          ctx.roundRect(x - 2, y - 2, cell + 4, cell + 4, radius + 2)
          ctx.lineWidth = 2
          ctx.strokeStyle = INK
          ctx.stroke()
        }
      }
    }
  }, [cell, pitch, rows, size, firstYear, bornMonth, thisMonth, monthBands])

  // Size the canvas to the scroll box (sharp on high-density screens).
  useLayoutEffect(() => {
    const el = scroller.current
    if (!el) return
    const measure = () => setSize({ w: el.clientWidth, h: el.clientHeight })
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  useLayoutEffect(() => {
    const cv = canvas.current
    if (!cv || !size.w) return
    const dpr = window.devicePixelRatio || 1
    cv.width = Math.round(size.w * dpr)
    cv.height = Math.round(size.h * dpr)
    draw()
  }, [size, draw])

  // Open with this month's row in the middle — every time.
  const opened = useRef(false)
  useLayoutEffect(() => {
    const el = scroller.current
    if (!el || !cell || opened.current) return
    opened.current = true
    const row = Number(thisMonth.slice(0, 4)) - firstYear
    el.scrollTop = row * pitch - (size.h - cell) / 2
    draw()
  }, [cell, pitch, size, thisMonth, firstYear, draw])

  // Redraw on scroll, once per frame.
  const frame = useRef(0)
  const onScroll = () => {
    cancelAnimationFrame(frame.current)
    frame.current = requestAnimationFrame(draw)
  }
  useEffect(() => () => cancelAnimationFrame(frame.current), [])

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
      <LifeHead profile={profile} current="months" onPick={onResolution} ready={['years', 'months']} />
      <div className="life-canvas" ref={scroller} onScroll={onScroll} onClick={onTap}>
        <canvas ref={canvas} style={{ width: size.w, height: size.h }} aria-hidden="true" />
        <div style={{ height: Math.max(0, totalH - size.h) }} />
      </div>
      <ZoomBar hint="each square a month · scroll for your whole life" onIn={onIn} />
    </main>
  )
}
