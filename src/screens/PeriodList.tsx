import { useLayoutEffect, useRef, useState, type MutableRefObject, type ReactNode } from 'react'
import { ZoomBar } from '../components/ZoomBar'
import { glide, pulse } from '../lib/backToToday'
import { fromIso, isoDate, monthTitle, todayIso } from '../lib/dates'
import type { Days } from '../lib/days'
import { PAINTS, WORD } from '../lib/paints'
import { bands, monthEnd } from '../lib/tally'
import { monthsBetween, shiftMonth } from './Month'
import { PaintingButton } from '../components/PaintingButton'

type Props = {
  /** Months: one card per month, under its year. Years: one card per year. */
  res: 'months' | 'years'
  days: Days
  born?: string
  /** A day inside the period to open on. */
  focus: string
  /** Tap a card: zoom in on it (its months, or its days), opening at its first day. */
  onOpen: (first: string) => void
  onIn: () => void
  onOut?: () => void
  /** Kept up to date with the day in the middle of the screen, so a zoom or a switch opens there. */
  mid: MutableRefObject<() => string>
  /** The life's own head — title, life glass and the years · months · days capsule — as on the squares. */
  head?: ReactNode
  /** A month's or a year's painting ("YYYY-MM" or "YYYY"): opens it, to look at and keep. */
  onPainting?: (period: string) => void
}

/** How a stretch of days was painted: each colour, and the days lived but not painted. */
function counts(days: Days, from: string, to: string, today: string, born?: string) {
  const start = born && born > from ? born : from
  const end = to < today ? to : today
  const out = { green: 0, red: 0, grey: 0, unpainted: 0 }
  if (start > end) return out
  for (let d = fromIso(start); ; d.setDate(d.getDate() + 1)) {
    const iso = isoDate(d)
    if (iso > end) break
    const day = days[iso]
    if (day) out[day.color]++
    else out.unpainted++
  }
  return out
}

/**
 * One month or one year in the list: its name, a band of its colours (the same shares as its square, laid on
 * their side), and how many days of each. A tap anywhere zooms in on it.
 */
function PeriodCard({
  id,
  title,
  from,
  to,
  days,
  today,
  born,
  onOpen,
  onPainting,
}: {
  id: string
  title: string
  from: string
  to: string
  days: Days
  today: string
  born?: string
  onOpen: (first: string) => void
  onPainting?: (period: string) => void
}) {
  const period = id.length === 4 ? id : id.slice(0, 7)
  const bs = bands(days, from, to, today, born)
  const c = counts(days, from, to, today, born)
  const parts = PAINTS.filter((p) => c[p.id]).map((p) => `${c[p.id]} ${WORD[p.id]}`)
  if (c.unpainted) parts.push(`${c.unpainted} unpainted`)
  const now = from <= today && today <= to
  return (
    <article className={'period-card' + (now ? ' is-today' : '')} data-key={id}>
      <button className="period-card-open" aria-label={`Open ${title}`} onClick={() => onOpen(from)}>
        {title}
      </button>
      <span className="period-band" aria-hidden="true">
        {bs.map((b, i) => (
          <span key={i} style={{ background: b.fill, width: `${b.share * 100}%` }} />
        ))}
      </span>
      <span className="period-counts">{parts.join(' · ')}</span>
      {/* Its painting, at the card's top right, once it holds any squares. */}
      {onPainting && Object.keys(days).some((iso) => iso.startsWith(period)) && (
        <span className="period-paint">
          <PaintingButton period={period} label={title.length === 4 ? title : monthTitle(from)} onOpen={onPainting} />
        </span>
      )}
    </article>
  )
}

// A life, month by month (or year by year): the zoomed-out levels of the list. Every month — or year — from birth
// to now, oldest at the top, as cards with their colour band and counts. Few enough to draw all at once.
export function PeriodList({ res, days, born, focus, onOpen, onIn, onOut, mid, head, onPainting }: Props) {
  const today = todayIso()
  const current = shiftMonth(today, 0)
  const first = born ? shiftMonth(born, 0) : shiftMonth(today, -120)
  const at = focus > today ? today : born && focus < born ? born : focus
  const key = (iso: string) => (res === 'years' ? iso.slice(0, 4) : shiftMonth(iso, 0))
  const scroller = useRef<HTMLDivElement>(null)
  const [away, setAway] = useState(false)

  const months = Array.from({ length: monthsBetween(first, current) + 1 }, (_, i) => shiftMonth(first, i))
  const years = Array.from({ length: Number(today.slice(0, 4)) - Number(first.slice(0, 4)) + 1 }, (_, i) =>
    String(Number(first.slice(0, 4)) + i),
  )

  const centre = (k: string, smooth = false) => {
    const el = scroller.current
    const card = el?.querySelector<HTMLElement>(`[data-key="${k}"]`)
    if (!el || !card) return
    const to = card.offsetTop - (el.clientHeight - card.offsetHeight) / 2
    if (smooth) glide(el, to, () => pulse(card))
    else el.scrollTop = to
  }
  useLayoutEffect(() => centre(key(at)), []) // eslint-disable-line react-hooks/exhaustive-deps

  // The day a zoom or a switch should open on: the middle of the card in the middle of the screen.
  mid.current = () => {
    const el = scroller.current
    if (!el) return at
    const y = el.scrollTop + el.clientHeight / 2
    for (const card of el.querySelectorAll<HTMLElement>('[data-key]'))
      if (card.offsetTop + card.offsetHeight > y) {
        const k = card.dataset.key!
        const d = k.length === 4 ? `${k}-07-01` : `${k.slice(0, 8)}15`
        return d > today ? today : d
      }
    return today
  }

  const onScroll = () => {
    const el = scroller.current
    const card = el?.querySelector<HTMLElement>('.period-card.is-today')
    if (!el) return
    setAway(
      !card || card.offsetTop > el.scrollTop + el.clientHeight || card.offsetTop + card.offsetHeight < el.scrollTop,
    )
  }

  const card = (id: string, title: string, from: string, to: string) => (
    <li key={id}>
      <PeriodCard
        id={id}
        title={title}
        from={from}
        to={to}
        days={days}
        today={today}
        born={born}
        onOpen={onOpen}
        onPainting={onPainting}
      />
    </li>
  )

  return (
    <main className="days-list">
      {head ?? (
        <div className="life-head">
          <h1 className="life-title">a life</h1>
        </div>
      )}
      <div className="days-scroll" ref={scroller} onScroll={onScroll}>
        {res === 'years' ? (
          <ol className="month-list is-periods">{years.map((y) => card(y, y, `${y}-01-01`, `${y}-12-31`))}</ol>
        ) : (
          years.map((y) => (
            <section key={y} className="days-month">
              <div className="ladder-label month-label">
                {y}
                {onPainting && Object.keys(days).some((iso) => iso.startsWith(y)) && (
                  <PaintingButton period={y} label={y} onOpen={onPainting} />
                )}
              </div>
              <ol className="month-list is-periods">
                {months.filter((m) => m.startsWith(y)).map((m) => card(m, monthTitle(m).split(' ')[0], m, monthEnd(m)))}
              </ol>
            </section>
          ))
        )}
      </div>
      <ZoomBar
        onIn={onIn}
        onOut={onOut}
        onRecenter={away ? () => centre(key(today), true) : undefined}
        listAt={() => mid.current()}
      />
    </main>
  )
}
