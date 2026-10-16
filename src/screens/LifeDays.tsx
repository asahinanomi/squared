import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { LifeHead, type Resolution } from '../components/LifeHead'
import { ZoomBar } from '../components/ZoomBar'
import { isoDate, longDate, shortWeekday, todayIso } from '../lib/dates'
import type { Days } from '../lib/days'
import { addYears, daysBetween } from '../lib/life'
import { paintHex, paintTint } from '../lib/paints'
import type { Profile } from '../lib/profile'
import { fitText, roundRect, useCanvasList } from '../lib/useCanvasList'
import type { Focal } from '../lib/usePinch'

type Props = {
  days: Days
  profile: Profile
  /** Open a day (to paint it). */
  onPick: (iso: string) => void
  /** Zoom in: this year. */
  onIn: () => void
  onResolution: (r: Resolution) => void
  /** Squares per row: 28, or fewer and bigger when pinched in (14, 7, 3). */
  cols?: number
  /** Where the fingers were when the size changed: the day under them stays put. */
  focal?: Focal
}

const GAP = 2
const LABEL_H = 18 // year label above each block
const BLOCK_GAP = 16 // space between years
const LIVED_BLANK = '#eeeee8'
const AHEAD = '#f1f1ec'
const AHEAD_EDGE = '#e4e4dd'
const INK = '#141413'
const NUM_MIN = 40 // squares at least this big print their day number…
const DATE_COLS = 3 // …and only at the deepest zoom, the full "2026.10 Thu" under it (if it fits)
const FONT = "'Schibsted Grotesk', system-ui, sans-serif"

const daysInYear = (y: number) => (new Date(y, 1, 29).getDate() === 29 ? 366 : 365)

// A life, in days — one solid square per real day, grouped into a block per year (each labelled,
// with a gap between years). Long by design: you scroll your whole life, year by year.
// Drawn on a canvas, only the rows on screen. Opens on today, where lived days meet the empty ones.
export function LifeDays({ days, profile, onPick, onIn, onResolution, cols = 28, focal }: Props) {
  const today = todayIso()
  const { born, lifespan } = profile
  const end = addYears(born, lifespan) // the first day after the hoped-for last one
  const firstYear = Number(born.slice(0, 4))
  const years = Number(end.slice(0, 4)) - firstYear + (end.slice(5) === '01-01' ? 0 : 1)
  const [picked, setPicked] = useState<string | null>(null)

  const geometry = (w: number, n = cols) => {
    const cell = (w - GAP * (n - 1)) / n
    const pitch = cell + GAP
    const rowsPerYear = Math.ceil(366 / n)
    return { cell, pitch, block: LABEL_H + rowsPerYear * pitch - GAP + BLOCK_GAP }
  }

  /** Where a date sits: block (year) index, row and column within the block. */
  const place = (iso: string, n = cols) => {
    const y = Number(iso.slice(0, 4))
    const i = daysBetween(`${y}-01-01`, iso)
    return { b: y - firstYear, r: Math.floor(i / n), c: i % n }
  }

  const { scroller, canvas, size, onScroll } = useCanvasList(
    (ctx, top, w, h) => {
      const { cell, pitch, block } = geometry(w)
      const b0 = Math.max(0, Math.floor(top / block))
      const b1 = Math.min(years - 1, Math.floor((top + h) / block))
      const radius = Math.min(8, Math.max(2, cell * 0.18))
      const labels = cell >= NUM_MIN
      const dated = cols === DATE_COLS
      for (let b = b0; b <= b1; b++) {
        const year = firstYear + b
        const y0 = b * block - top
        ctx.textAlign = 'left'
        ctx.textBaseline = 'alphabetic'
        ctx.font = `600 11px ${FONT}`
        ctx.fillStyle = String(year) === today.slice(0, 4) ? INK : '#c7c7c0'
        ctx.fillText(String(year), 0, y0 + 12)
        const n = daysInYear(year)
        const rowFrom = Math.max(0, Math.floor((-y0 - LABEL_H) / pitch)) // first row on screen
        for (let i = rowFrom * cols; i < n; i++) {
          const r = Math.floor(i / cols)
          const y = y0 + LABEL_H + r * pitch
          if (y > h) break
          if (y + cell < 0) continue
          const x = (i % cols) * pitch
          const iso = isoDate(new Date(year, 0, 1 + i))
          if (iso < born || iso >= end) continue
          const day = days[iso]
          const ahead = iso > today
          roundRect(ctx, x, y, cell, cell, radius)
          ctx.fillStyle = day
            ? day.backfilled
              ? paintTint(day.color)
              : paintHex(day.color)
            : ahead
              ? AHEAD
              : LIVED_BLANK
          ctx.fill()
          if (ahead && labels) {
            ctx.lineWidth = 1
            ctx.strokeStyle = AHEAD_EDGE
            ctx.stroke()
          }
          if (iso === today) {
            roundRect(ctx, x - 1.5, y - 1.5, cell + 3, cell + 3, radius + 1.5)
            ctx.lineWidth = 1.5
            ctx.strokeStyle = INK
            ctx.stroke()
          }
          if (labels) {
            // Clipped to the square, centred, and drawn only if it fits: a label never spills over.
            ctx.save()
            roundRect(ctx, x, y, cell, cell, radius)
            ctx.clip()
            ctx.textAlign = 'center'
            ctx.textBaseline = 'middle'
            ctx.fillStyle = ahead ? '#bdbdb6' : day && !day.backfilled ? '#fff' : '#24241f'
            const pad = cell * 0.08
            ctx.font = `600 ${Math.round(cell * 0.32)}px ${FONT}`
            const ny = dated ? y + cell * 0.42 : y + cell / 2
            fitText(ctx, String(Number(iso.slice(8))), x + cell / 2, ny, cell - pad * 2)
            if (dated) {
              const d = `${iso.slice(0, 4)}.${iso.slice(5, 7)} ${shortWeekday(iso)}`
              const font = (px: number) => `400 ${px}px ${FONT}`
              fitText(ctx, d, x + cell / 2, y + cell * 0.72, cell - pad * 2, {
                font,
                px: Math.round(cell * 0.13),
                min: 9,
              })
            }
            ctx.restore()
          }
        }
      }
    },
    // Open with today in the middle.
    (w, h) => {
      const { pitch, block } = geometry(w)
      const p = place(today)
      return p.b * block + LABEL_H + p.r * pitch - h / 2
    },
  )

  const { cell, pitch, block } = size.w ? geometry(size.w) : { cell: 0, pitch: 0, block: 0 }

  /** The day at a point in the scroll box, under a given layout (null in a gap or a label). */
  const dayAt = (x: number, yAll: number, n: number) => {
    const g = geometry(size.w, n)
    const b = Math.floor(yAll / g.block)
    const yIn = yAll - b * g.block - LABEL_H
    const c = Math.min(n - 1, Math.max(0, Math.floor(x / g.pitch)))
    const r = Math.max(0, Math.floor(yIn / g.pitch))
    const year = firstYear + Math.max(0, Math.min(years - 1, b))
    const i = Math.min(daysInYear(year) - 1, r * n + c)
    return isoDate(new Date(year, 0, 1 + i))
  }

  // After a pinch changes the size, keep the day that was under the fingers under them.
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
    const iso = dayAt(fx, topBefore.current + fy, was)
    const p = place(iso)
    el.scrollTop = p.b * block + LABEL_H + p.r * pitch + cell / 2 - fy
  }, [cols]) // eslint-disable-line react-hooks/exhaustive-deps

  // A tapped day shows its date for a moment (scrolling clears it).
  useEffect(() => {
    if (!picked) return
    const t = setTimeout(() => setPicked(null), 4000)
    return () => clearTimeout(t)
  }, [picked])

  const onTap = (e: React.MouseEvent) => {
    const el = scroller.current
    if (!el || !cell) return
    const box = el.getBoundingClientRect()
    const x = e.clientX - box.left
    const yAll = e.clientY - box.top + el.scrollTop
    const b = Math.floor(yAll / block)
    const yIn = yAll - b * block - LABEL_H
    const c = Math.floor(x / pitch)
    const r = Math.floor(yIn / pitch)
    if (b < 0 || b >= years || yIn < 0 || c < 0 || c >= cols || x - c * pitch > cell || yIn - r * pitch > cell) return
    const year = firstYear + b
    const i = r * cols + c
    if (i >= daysInYear(year)) return
    const iso = isoDate(new Date(year, 0, 1 + i))
    if (iso < born || iso >= end) return
    setPicked(iso)
  }

  const totalH = years * block - BLOCK_GAP
  return (
    <main className="life">
      <LifeHead profile={profile} current="days" onPick={onResolution} />
      <div
        className="life-canvas"
        ref={scroller}
        onScroll={() => {
          onScroll()
          if (picked) setPicked(null)
        }}
        onClick={onTap}
      >
        <canvas ref={canvas} style={{ width: size.w, height: size.h }} aria-hidden="true" />
        <div style={{ height: Math.max(0, totalH - size.h) }} />
      </div>
      {picked && (
        <div className="day-chip" role="status">
          <span>{longDate(picked)}</span>
          {picked <= today && (
            <button onClick={() => onPick(picked)} aria-label={`Open ${longDate(picked)}`}>
              open ›
            </button>
          )}
        </div>
      )}
      <ZoomBar
        hint={
          cols === DATE_COLS
            ? 'zoomed in — each day shows its full date'
            : 'each block is a year · each square a day · today is outlined'
        }
        onIn={onIn}
      />
    </main>
  )
}
