import { useEffect, useLayoutEffect } from 'react'
import { ZoomBar } from '../components/ZoomBar'
import {
  fromIso,
  isoDate,
  longDate,
  monthCells,
  monthTitle,
  plainDate,
  shortDateParts,
  shortWeekday,
  todayIso,
} from '../lib/dates'
import type { Days } from '../lib/days'
import type { Notes } from '../lib/notes'
import { useBackToToday } from '../lib/backToToday'
import { paintHex, paintTint, type Paint } from '../lib/paints'
import { useLadderScroll } from '../lib/useLadderScroll'
import { Chevron } from './Today'

type Props = {
  days: Days
  /** Earliest month that can be shown (the birth date), if known. */
  born?: string
  /** Month to open on (zooming in from a year); otherwise the current month. */
  focus?: string
  onPick: (iso: string) => void
  /** Zoom in: back to the single square. */
  onIn: () => void
  /** Zoom out to the year. */
  onOut?: () => void
  /** Pinched in: bigger day squares (3 to a row) that print their full date. */
  zoomed?: boolean
  /** Pinched in once more: one row per day, to read — its word, the latest note, when it was painted. */
  reading?: boolean
  notes?: Notes
  /** A month came into view while reading: load its notes. */
  onMonthShown?: (iso: string) => void
  /** The day under the fingers when the zoom changed, kept where it was on screen. */
  anchor?: { iso?: string; y: number }
}

const WEEKDAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S']
const WORD: Record<Paint, string> = { green: 'mattered', red: 'empty', grey: 'slipped' }

/** Every day of the month containing `iso`, first to last. */
const monthDays = (iso: string) => monthCells(iso).filter((d): d is string => !!d)

/** First of the month `n` months away from the month containing `iso`. */
export const shiftMonth = (iso: string, n: number) => {
  const d = fromIso(iso)
  return isoDate(new Date(d.getFullYear(), d.getMonth() + n, 1))
}
export const monthsBetween = (a: string, b: string) =>
  (Number(b.slice(0, 4)) - Number(a.slice(0, 4))) * 12 + Number(b.slice(5, 7)) - Number(a.slice(5, 7))

// My squares — your months, one after another in a single scroll, from the birth month
// down to this one (next month peeks in faintly below). Opens centred on this month.
export function Month({
  days,
  born,
  focus,
  onPick,
  onIn,
  onOut,
  zoomed = false,
  reading = false,
  notes = {},
  onMonthShown,
  anchor,
}: Props) {
  const today = todayIso()
  const current = shiftMonth(today, 0)
  const maxBack = born ? monthsBetween(shiftMonth(born, 0), current) : Infinity
  const start = focus ? shiftMonth(focus, 0) : current
  const { scroller, back, visible, onScroll, jumpTo } = useLadderScroll({
    maxBack,
    batch: 12,
    focus: start,
    focusBack: monthsBetween(start, current),
  })

  const toToday = useBackToToday(scroller, '.month-day.is-today, .month-row.is-today')

  // Reading: the month in view and its neighbours bring their notes.
  useEffect(() => {
    if (!reading || !onMonthShown) return
    for (const n of [-1, 0, 1]) if (shiftMonth(visible, n) <= current) onMonthShown(shiftMonth(visible, n))
  }, [reading, visible]) // eslint-disable-line react-hooks/exhaustive-deps
  const months = Array.from({ length: back + 1 }, (_, i) => shiftMonth(current, i - back))
  const step = (n: number) => {
    const target = shiftMonth(visible, n)
    jumpTo(target, monthsBetween(target, current))
  }
  const next = shiftMonth(current, 1)

  // After zooming, put the day that was under the fingers back under them.
  useLayoutEffect(() => {
    const el = scroller.current
    if (!el || !anchor) return
    const target =
      (anchor.iso && el.querySelector<HTMLElement>(`[data-iso="${anchor.iso}"]`)) ||
      el.querySelector<HTMLElement>(`[data-key="${visible}"]`)
    if (!target) return
    const r = target.getBoundingClientRect()
    el.scrollTop += r.top + r.height / 2 - anchor.y
  }, [zoomed, reading]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <main className={'month' + (zoomed ? ' is-zoomed' : '') + (reading ? ' is-reading' : '')}>
      <div className="ladder-head">
        <button
          aria-label="Previous month"
          disabled={monthsBetween(visible, current) >= maxBack}
          onClick={() => step(-1)}
        >
          <Chevron dir="left" />
        </button>
        <h1 className="ladder-title">{monthTitle(visible)}</h1>
        <button aria-label="Next month" disabled={visible >= current} onClick={() => step(1)}>
          <Chevron dir="right" />
        </button>
      </div>
      <div className="month-grid is-weekdays" aria-hidden="true" hidden={zoomed}>
        {WEEKDAYS.map((d, i) => (
          <span key={i}>{d}</span>
        ))}
      </div>

      <div
        className="ladder-scroll"
        ref={scroller}
        onScroll={() => {
          onScroll()
          toToday.check()
        }}
      >
        {months.map((m) => (
          <section key={m} className="month-block" data-key={m}>
            <div className="ladder-label">{monthTitle(m)}</div>
            {reading ? (
              <ol className="month-rows">
                {monthDays(m)
                  .filter((iso) => iso <= today && (!born || iso >= born))
                  .map((iso) => {
                    const day = days[iso]
                    const note = notes[iso]?.at(-1)?.body.split('\n')[0]
                    const { weekday, monthDay, suffix } = shortDateParts(iso)
                    return (
                      <li key={iso}>
                        <button
                          className={'month-row' + (day ? ' is-painted' : '') + (iso === today ? ' is-today' : '')}
                          aria-label={longDate(iso)}
                          data-iso={iso}
                          onClick={() => onPick(iso)}
                        >
                          <span
                            className="month-row-swatch"
                            style={
                              day
                                ? { background: day.backfilled ? paintTint(day.color) : paintHex(day.color) }
                                : undefined
                            }
                            aria-hidden="true"
                          />
                          <span className="month-row-text">
                            <span className="month-row-date">
                              {weekday}, {monthDay}
                              <sup>{suffix}</sup>
                              {day && <span className="month-row-word"> · {WORD[day.color]}</span>}
                            </span>
                            {note && <span className="month-row-note">{note}</span>}
                            {day?.backfilled && day.paintedOn && (
                              <span className="month-row-painted">painted {plainDate(day.paintedOn)}</span>
                            )}
                          </span>
                        </button>
                      </li>
                    )
                  })}
              </ol>
            ) : (
              <div className="month-grid">
                {monthCells(m).map((iso, i) => {
                  if (!iso) return zoomed ? null : <span key={`b${i}`} className="is-blank" />
                  const day = days[iso]
                  const fill = day ? (day.backfilled ? paintTint(day.color) : paintHex(day.color)) : undefined
                  return (
                    <button
                      key={iso}
                      className={'month-day' + (day ? ' is-painted' : '') + (iso === today ? ' is-today' : '')}
                      style={fill ? { background: fill } : undefined}
                      disabled={iso > today || (!!born && iso < born)}
                      aria-label={longDate(iso)}
                      data-iso={iso}
                      onClick={() => onPick(iso)}
                    >
                      <span className="month-num">{Number(iso.slice(8))}</span>
                      <span className="month-wd">
                        {zoomed ? `${iso.slice(0, 4)}.${iso.slice(5, 7)} ${shortWeekday(iso)}` : shortWeekday(iso)}
                      </span>
                    </button>
                  )
                })}
              </div>
            )}
          </section>
        ))}
        {/* Next month peeks in, faint: there's more ahead, not yet lived. */}
        <section className="month-block is-faint" aria-hidden="true">
          <div className="ladder-label">{monthTitle(next)}</div>
          <div className="month-grid is-faint">
            {monthCells(next).map((d, i) =>
              d ? <span key={d}>{Number(d.slice(8))}</span> : <span key={`b${i}`} className="is-blank" />,
            )}
          </div>
        </section>
      </div>

      <ZoomBar onIn={onIn} onOut={onOut} onRecenter={toToday.away ? toToday.back : undefined} />
    </main>
  )
}
