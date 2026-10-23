import { useEffect, useState } from 'react'
import { fromIso, monthCells } from '../lib/dates'
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
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']
const pad = (n: number) => String(n).padStart(2, '0')

// Find a day from your past the way memory does: which year (with how old you were), which month, then the day.
// Opened from the date on the day screen; painted days show their colour, so you can see what's there already.
export function DayFinder({ open, onClose, date, today, born, days, onPick }: Props) {
  const [step, setStep] = useState<'year' | 'month' | 'day'>('year')
  const [year, setYear] = useState(Number(date.slice(0, 4)))
  const [month, setMonth] = useState(Number(date.slice(5, 7)))
  // Each time it opens: on the year you're looking at, starting from the years.
  useEffect(() => {
    if (!open) return
    setStep('year')
    setYear(Number(date.slice(0, 4)))
    setMonth(Number(date.slice(5, 7)))
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps

  const first = born ?? `${Number(today.slice(0, 4)) - 100}-01-01`
  const bornYear = born ? Number(born.slice(0, 4)) : null
  const thisYear = Number(today.slice(0, 4))
  const years = Array.from({ length: thisYear - Number(first.slice(0, 4)) + 1 }, (_, i) => thisYear - i)
  const painted = Object.keys(days)
  const has = (prefix: string) => painted.some((d) => d.startsWith(prefix))
  const ym = `${year}-${pad(month)}`

  return (
    <Sheet open={open} onClose={onClose}>
      <div className="finder">
        <div className="finder-head">
          {step !== 'year' && (
            <button className="finder-back" onClick={() => setStep(step === 'day' ? 'month' : 'year')}>
              ‹ {step === 'day' ? year : 'years'}
            </button>
          )}
          <h2 className="sheet-title">
            {step === 'year'
              ? 'which year?'
              : step === 'month'
                ? `which month? · ${year}`
                : `which day? · ${MONTHS[month - 1]} ${year}`}
          </h2>
        </div>

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
                  {/* How old you were (by the end of that year): memory often keeps the age, not the year. */}
                  {bornYear !== null && <small>{y === bornYear ? 'born' : `age ${y - bornYear}`}</small>}
                  {has(String(y)) && <i className="finder-dot" aria-label="has painted days" />}
                </button>
              </li>
            ))}
          </ul>
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
                      className={(iso === date ? 'is-here' : '') + (d ? ' is-painted' : '')}
                      style={d ? { background: squareFill(d.color, d.framed), boxShadow: 'none' } : undefined}
                      aria-label={fromIso(iso).toLocaleDateString('en-US', { dateStyle: 'full' })}
                      onClick={() => onPick(iso)}
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
