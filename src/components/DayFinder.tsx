import { useEffect, useState } from 'react'
import { ageOn, firstDay, fromIso, monthCells } from '../lib/dates'
import type { Days } from '../lib/days'
import { squareFill } from '../lib/paints'
import { Sheet } from './Sheet'

type Props = {
  open: boolean
  onClose: () => void
  /** The day you're on: the finder opens on its year and month. */
  date: string
  today: string
  born?: string
  days: Days
  onPick: (iso: string) => void
  /** Without a birth date the years start at your first square's: the way to set one, to go further back. */
  onSetUp?: () => void
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']
const pad = (n: number) => String(n).padStart(2, '0')

const plural = (n: number, w: string) => `${n} ${w}${n === 1 ? '' : 's'}`

// Find a day from your past the way memory does: which year (with how old you were), which month, then the day.
// Opened from the date on the day screen; painted days show their colour, so you can see what's there already.
export function DayFinder({ open, onClose, date, today, born, days, onPick, onSetUp }: Props) {
  const [step, setStep] = useState<'year' | 'month' | 'day'>('year')
  const [year, setYear] = useState(Number(date.slice(0, 4)))
  const [month, setMonth] = useState(Number(date.slice(5, 7)))
  // The day just picked: held for a moment, with how old you were, before it opens.
  const [picked, setPicked] = useState<string | null>(null)
  // Each time it opens: on the year you're looking at, starting from the years.
  useEffect(() => {
    if (!open) return
    setStep('year')
    setPicked(null)
    setYear(Number(date.slice(0, 4)))
    setMonth(Number(date.slice(5, 7)))
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps
  // A moment to read your age, then the day opens (a tap opens it at once).
  useEffect(() => {
    if (!picked) return
    const t = setTimeout(() => onPick(picked), 4500) // long enough to read the age line
    return () => clearTimeout(t)
  }, [picked]) // eslint-disable-line react-hooks/exhaustive-deps

  const first = firstDay(days, born)
  const bornYear = born ? Number(born.slice(0, 4)) : null
  const thisYear = Number(today.slice(0, 4))
  const years = Array.from({ length: thisYear - Number(first.slice(0, 4)) + 1 }, (_, i) => thisYear - i)
  const painted = Object.keys(days)
  const has = (prefix: string) => painted.some((d) => d.startsWith(prefix))
  const ym = `${year}-${pad(month)}`
  const ageLine = () => {
    if (!born) return ''
    if (picked) {
      if (picked === born) return 'The day you were born.'
      const a = ageOn(born, picked)
      if (!a.years) return `You were ${plural(a.months, 'month')} old.`
      return a.months
        ? `You were ${plural(a.years, 'year')} and ${plural(a.months, 'month')} old.`
        : `You were exactly ${plural(a.years, 'year')} old.`
    }
    const mid = step === 'day' ? `${ym}-15` : `${year}-07-01`
    const a = ageOn(born, mid < born ? born : mid)
    return year === Number(born.slice(0, 4)) && step === 'month'
      ? 'The year you were born.'
      : `You were about ${a.years}.`
  }

  return (
    <Sheet open={open} onClose={onClose}>
      <div className="finder">
        <div className="finder-head">
          <h2 className="torn-title">
            {step === 'year' ? 'which year?' : step === 'month' ? 'which month?' : 'which day?'}
          </h2>
          {/* What's chosen so far, on the right, apart from the question, growing as you go: "2010", "Feb 2010",
              "Feb 23, 2010" (the app's way of writing dates). Tap the month or the year to choose it again. */}
          {step !== 'year' && (
            <span className="finder-chosen">
              {step === 'day' && (
                <button onClick={() => (setPicked(null), setStep('month'))}>
                  {MONTHS[month - 1]}
                  {picked ? ` ${Number(picked.slice(8))},` : ''}
                </button>
              )}{' '}
              <button onClick={() => (setPicked(null), setStep('year'))}>{year}</button>
            </span>
          )}
        </div>
        {/* How old you were, as soon as the year is chosen (roughly), then exactly, once it's the day. */}
        {born && step !== 'year' && (
          <p className="finder-age" aria-live="polite">
            {ageLine()}
            {/* While it pauses on the picked day: the way to go now, right where the eyes are. */}
            {picked && (
              <>
                {' '}
                <button className="finder-go" onClick={() => onPick(picked)}>
                  paint this day →
                </button>
              </>
            )}
          </p>
        )}

        {step === 'year' && (
          <ul className="finder-grid is-years">
            {years.map((y) => (
              <li key={y}>
                <button
                  className={y === Number(date.slice(0, 4)) ? 'is-here' : undefined}
                  onClick={() => {
                    setYear(y)
                    setStep('month')
                  }}
                >
                  <b>{y}</b>
                  {/* How old you were that year (mid-year, as the line above says "about"): memory often keeps the age. */}
                  {bornYear !== null && (
                    <small>{y === bornYear ? 'born' : `age ${ageOn(born!, `${y}-07-01`).years}`}</small>
                  )}
                  {has(String(y)) && <i className="finder-dot" aria-label="has painted days" />}
                </button>
              </li>
            ))}
          </ul>
        )}
        {/* Without a birth date the years start at your first square's: a nudge to go further back. */}
        {step === 'year' && !born && onSetUp && (
          <button
            className="ladder-setup is-in-finder"
            onClick={() => {
              onClose()
              onSetUp()
            }}
          >
            set your birth date to go further back ›
          </button>
        )}

        {step === 'month' && (
          <ul className="finder-grid is-months">
            {MONTHS.map((m, i) => {
              const key = `${year}-${pad(i + 1)}`
              const off = key > today.slice(0, 7) || key < first.slice(0, 7)
              return (
                <li key={m}>
                  <button
                    disabled={off}
                    className={key === date.slice(0, 7) ? 'is-here' : undefined}
                    onClick={() => {
                      setMonth(i + 1)
                      setStep('day')
                    }}
                  >
                    <b>{m}</b>
                    {has(key) && <i className="finder-dot" aria-label="has painted days" />}
                  </button>
                </li>
              )
            })}
          </ul>
        )}

        {step === 'day' && (
          <>
            <ul className="finder-grid is-days is-weekdays" aria-hidden="true">
              {WEEKDAYS.map((w, i) => (
                <li key={i}>{w}</li>
              ))}
            </ul>
            <ul className="finder-grid is-days">
              {monthCells(`${ym}-01`).map((iso, i) => {
                if (!iso) return <li key={`x${i}`} />
                const d = days[iso]
                const off = iso > today || iso < first
                return (
                  <li key={iso}>
                    <button
                      disabled={off}
                      className={(iso === (picked ?? date) ? 'is-here' : '') + (d ? ' is-painted' : '')}
                      style={d ? { background: squareFill(d.color, d.framed), boxShadow: 'none' } : undefined}
                      aria-label={fromIso(iso).toLocaleDateString('en-US', { dateStyle: 'full' })}
                      onClick={() => (picked === iso ? onPick(iso) : setPicked(iso))}
                    >
                      {Number(iso.slice(8))}
                    </button>
                  </li>
                )
              })}
            </ul>
          </>
        )}
      </div>
    </Sheet>
  )
}
