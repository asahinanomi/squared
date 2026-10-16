import { useCallback, useLayoutEffect, useRef, useState } from 'react'
import { ZoomBar } from '../components/ZoomBar'
import { fromIso, isoDate, longDate, monthCells, monthTitle, shortWeekday, todayIso } from '../lib/dates'
import type { Days } from '../lib/days'
import { paintHex, paintTint } from '../lib/paints'
import { Chevron } from './Today'

type Props = {
  days: Days
  /** Earliest month that can be shown (the birth date), if known. */
  born?: string
  onPick: (iso: string) => void
  /** Zoom in: back to the single square. */
  onIn: () => void
  /** Zoom out to the year (absent until that level exists). */
  onOut?: () => void
}

const WEEKDAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S']
const BATCH = 12 // months added at a time as you scroll back

/** First of the month `n` months away from the month containing `iso`. */
const shiftMonth = (iso: string, n: number) => {
  const d = fromIso(iso)
  return isoDate(new Date(d.getFullYear(), d.getMonth() + n, 1))
}
const monthsBetween = (a: string, b: string) =>
  (Number(b.slice(0, 4)) - Number(a.slice(0, 4))) * 12 + Number(b.slice(5, 7)) - Number(a.slice(5, 7))

// My squares — your months, one after another in a single scroll, from the birth month
// down to this one (next month peeks in faintly below). Always opens centred on this month.
export function Month({ days, born, onPick, onIn, onOut }: Props) {
  const today = todayIso()
  const current = shiftMonth(today, 0)
  const oldest = born ? shiftMonth(born, 0) : null
  const maxBack = oldest ? monthsBetween(oldest, current) : Infinity

  const [back, setBack] = useState(() => Math.min(BATCH, maxBack)) // how many months before this one are built
  const [visible, setVisible] = useState(current)
  const scroller = useRef<HTMLDivElement>(null)
  const heightBefore = useRef<number | null>(null)

  const months = Array.from({ length: back + 1 }, (_, i) => shiftMonth(current, i - back))
  const section = (m: string) => scroller.current?.querySelector<HTMLElement>(`[data-month="${m}"]`)

  // Open centred on this month.
  useLayoutEffect(() => {
    const el = scroller.current
    const sec = section(current)
    if (el && sec) el.scrollTop = sec.offsetTop - (el.clientHeight - sec.offsetHeight) / 2
    // Only on arrival: the app never remembers where you scrolled.
  }, [])

  // After adding older months above, keep what you're looking at in place.
  useLayoutEffect(() => {
    const el = scroller.current
    if (el && heightBefore.current !== null) {
      el.scrollTop += el.scrollHeight - heightBefore.current
      heightBefore.current = null
    }
  }, [back])

  const onScroll = useCallback(() => {
    const el = scroller.current
    if (!el) return
    if (el.scrollTop < el.clientHeight && back < maxBack && heightBefore.current === null) {
      heightBefore.current = el.scrollHeight
      setBack((b) => Math.min(b + BATCH, maxBack))
    }
    // The title follows the month crossing the middle of the screen.
    const mid = el.scrollTop + el.clientHeight / 2
    for (const sec of el.querySelectorAll<HTMLElement>('[data-month]')) {
      if (sec.offsetTop <= mid && sec.offsetTop + sec.offsetHeight > mid) {
        setVisible(sec.dataset.month!)
        break
      }
    }
  }, [back, maxBack])

  const jump = (n: number) => {
    const target = shiftMonth(visible, n)
    if (monthsBetween(target, current) > back) {
      heightBefore.current = scroller.current?.scrollHeight ?? null
      setBack((b) => Math.min(b + BATCH, maxBack))
    }
    setVisible(target)
    // A straight jump (a smooth glide would fight the months being added above).
    requestAnimationFrame(() => {
      const el = scroller.current
      const sec = section(target)
      if (el && sec) el.scrollTop = sec.offsetTop - (el.clientHeight - sec.offsetHeight) / 2
    })
  }
  const canPrev = monthsBetween(visible, current) < maxBack
  const canNext = visible < current

  const next = shiftMonth(current, 1)

  return (
    <main className="month">
      <div className="month-head">
        <button aria-label="Previous month" disabled={!canPrev} onClick={() => jump(-1)}>
          <Chevron dir="left" />
        </button>
        <h1 className="month-title">{monthTitle(visible)}</h1>
        <button aria-label="Next month" disabled={!canNext} onClick={() => jump(1)}>
          <Chevron dir="right" />
        </button>
      </div>
      <div className="month-grid is-weekdays" aria-hidden="true">
        {WEEKDAYS.map((d, i) => (
          <span key={i}>{d}</span>
        ))}
      </div>

      <div className="month-scroll" ref={scroller} onScroll={onScroll}>
        {months.map((m) => (
          <section key={m} className="month-block" data-month={m}>
            <div className="month-label">{monthTitle(m)}</div>
            <div className="month-grid">
              {monthCells(m).map((iso, i) => {
                if (!iso) return <span key={`b${i}`} className="is-blank" />
                const day = days[iso]
                const fill = day ? (day.backfilled ? paintTint(day.color) : paintHex(day.color)) : undefined
                return (
                  <button
                    key={iso}
                    className={'month-day' + (day ? ' is-painted' : '') + (iso === today ? ' is-today' : '')}
                    style={fill ? { background: fill } : undefined}
                    disabled={iso > today || (!!born && iso < born)}
                    aria-label={longDate(iso)}
                    onClick={() => onPick(iso)}
                  >
                    <span className="month-num">{Number(iso.slice(8))}</span>
                    <span className="month-wd">{shortWeekday(iso)}</span>
                  </button>
                )
              })}
            </div>
          </section>
        ))}
        {/* Next month peeks in, faint: there's more ahead, not yet lived. */}
        <section className="month-block is-faint" aria-hidden="true">
          <div className="month-label">{monthTitle(next)}</div>
          <div className="month-grid is-faint">
            {monthCells(next).map((d, i) =>
              d ? <span key={d}>{Number(d.slice(8))}</span> : <span key={`b${i}`} className="is-blank" />,
            )}
          </div>
        </section>
      </div>

      <ZoomBar hint="tap a day to paint · pinch to zoom out" onIn={onIn} onOut={onOut} />
    </main>
  )
}
