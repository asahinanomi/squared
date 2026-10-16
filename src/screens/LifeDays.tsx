import { useEffect, useState } from 'react'
import { LifeHead, type Resolution } from '../components/LifeHead'
import { ZoomBar } from '../components/ZoomBar'
import { isoDate, longDate, shortWeekday, todayIso } from '../lib/dates'
import type { Days } from '../lib/days'
import { addYears, daysBetween } from '../lib/life'
import { paintHex, paintTint } from '../lib/paints'
import type { Profile } from '../lib/profile'
import { roundRect, useCanvasList } from '../lib/useCanvasList'

type Props = {
  days: Days
  profile: Profile
  /** Open a day (to paint it). */
  onPick: (iso: string) => void
  /** Zoom in: this year. */
  onIn: () => void
  onResolution: (r: Resolution) => void
}

const COLS = 28 // a year's days wrap at 28 per row: 14 rows a year
const GAP = 2
const LABEL_H = 18 // year label above each block
const BLOCK_GAP = 16 // space between years
const LIVED_BLANK = '#eeeee8'
const AHEAD = '#f1f1ec'
const AHEAD_EDGE = '#e4e4dd'
const INK = '#141413'
const DATE_MIN = 40 // squares at least this big print their date: big day number, "2026.10 Thu" under it
const FONT = "'Schibsted Grotesk', system-ui, sans-serif"

const daysInYear = (y: number) => (new Date(y, 1, 29).getDate() === 29 ? 366 : 365)

// A life, in days — one solid square per real day, grouped into a block per year (each labelled,
// with a gap between years). Long by design: you scroll your whole life, year by year.
// Drawn on a canvas, only the rows on screen. Opens on today, where lived days meet the empty ones.
export function LifeDays({ days, profile, onPick, onIn, onResolution }: Props) {
  const today = todayIso()
  const { born, lifespan } = profile
  const end = addYears(born, lifespan) // the first day after the hoped-for last one
  const firstYear = Number(born.slice(0, 4))
  const years = Number(end.slice(0, 4)) - firstYear + (end.slice(5) === '01-01' ? 0 : 1)
  const [picked, setPicked] = useState<string | null>(null)

  const geometry = (w: number) => {
    const cell = (w - GAP * (COLS - 1)) / COLS
    const pitch = cell + GAP
    const rowsPerYear = Math.ceil(366 / COLS)
    return { cell, pitch, block: LABEL_H + rowsPerYear * pitch - GAP + BLOCK_GAP }
  }

  /** Where a date sits: block (year) index, row and column within the block. */
  const place = (iso: string) => {
    const y = Number(iso.slice(0, 4))
    const n = daysBetween(`${y}-01-01`, iso)
    return { b: y - firstYear, r: Math.floor(n / COLS), c: n % COLS }
  }

  const { scroller, canvas, size, onScroll } = useCanvasList(
    (ctx, top, w, h) => {
      const { cell, pitch, block } = geometry(w)
      const b0 = Math.max(0, Math.floor(top / block))
      const b1 = Math.min(years - 1, Math.floor((top + h) / block))
      const radius = Math.min(8, Math.max(2, cell * 0.18))
      const labels = cell >= DATE_MIN
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
        for (let i = rowFrom * COLS; i < n; i++) {
          const r = Math.floor(i / COLS)
          const y = y0 + LABEL_H + r * pitch
          if (y > h) break
          if (y + cell < 0) continue
          const x = (i % COLS) * pitch
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
            ctx.textAlign = 'center'
            ctx.textBaseline = 'middle'
            ctx.fillStyle = ahead ? '#bdbdb6' : day && !day.backfilled ? '#fff' : '#24241f'
            ctx.font = `600 ${Math.round(cell * 0.32)}px ${FONT}`
            ctx.fillText(String(Number(iso.slice(8))), x + cell / 2, y + cell * 0.42)
            ctx.font = `400 ${Math.max(9, Math.round(cell * 0.13))}px ${FONT}`
            ctx.fillText(`${iso.slice(0, 4)}.${iso.slice(5, 7)} ${shortWeekday(iso)}`, x + cell / 2, y + cell * 0.72)
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
    if (b < 0 || b >= years || yIn < 0 || c < 0 || c >= COLS || x - c * pitch > cell || yIn - r * pitch > cell) return
    const year = firstYear + b
    const i = r * COLS + c
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
      <ZoomBar hint="each block is a year · each square a day · today is outlined" onIn={onIn} />
    </main>
  )
}
