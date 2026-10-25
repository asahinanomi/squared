import type { ReactNode } from 'react'
import { PaintingThumb } from '../components/PaintingThumb'
import { todayIso } from '../lib/dates'
import type { Days } from '../lib/days'
import { lifeCounts } from '../lib/life'
import type { Profile } from '../lib/profile'
import { Chevron } from './Today'

const fmt = (n: number) => n.toLocaleString('en-US')

type Props = {
  days: Days
  profile: Profile | null
  /** Your "mattered" lines (empty until written): the row shows the first few. */
  matters: string[]
  /** The paintings you kept (none yet: the row says how to keep one). */
  kept: string[]
  /** "set up now" on the life card, before the squares are set: how many squares, then back here. */
  onSetUp: () => void
  onPainting: (period: string) => void
  /** The bar: time runs left to right, so it opens the list of days, on today. */
  onList: () => void
  onPie: () => void
  onSquares: () => void
  onMatters: () => void
  onFramed: () => void
  onPaintings: () => void
  /** Beside the title: back to today, now. */
  onToday: () => void
}

// my days (the menu): looking back, every door into your past in one place, never a dashboard of numbers. A life as one
// bar (days lived, days ahead; it opens the list), this month and year so far as paintings, then what matters, a life
// in squares, in slices, the days you framed and the paintings you kept. Home stays today, now. Each row is named
// after the page it opens; the page is "my days", so no row says "my".
// There's no onboarding: what isn't set up yet waits here, an empty slot (a dashed edge on paper, as for every
// empty slot) that says "set up now". The life card shows a ghost of its bar, so you can see what's coming.
export function MyDays({
  days,
  profile,
  matters,
  kept,
  onSetUp,
  onPainting,
  onList,
  onPie,
  onSquares,
  onMatters,
  onFramed,
  onPaintings,
  onToday,
}: Props) {
  const today = todayIso()
  const month = today.slice(0, 7)
  const year = today.slice(0, 4)
  const count = (p: string) => Object.keys(days).filter((d) => d.startsWith(p) && d <= today).length
  const hasMonth = count(month) > 0
  const hasYear = count(year) > 0
  const framed = Object.values(days).some((d) => d.framed)
  // Each row opens its page; `empty` is an empty slot (dashed), its sub a quiet "set up now" link look.
  const row = (label: string, sub: string, go: () => void, empty?: 'set up' | 'none', lead?: ReactNode) => (
    <button className={'settings-row' + (empty ? ' is-empty' : '')} onClick={go}>
      <span className={lead ? 'settings-lead' : undefined}>
        {lead}
        <span className="settings-text">
          <span className="settings-label">{label}</span>
          <span className={'settings-sub' + (empty === 'set up' ? ' is-set-up' : '')}>{sub}</span>
        </span>
      </span>
      <Chevron dir="right" />
    </button>
  )
  const setUp = 'set up now'
  return (
    <main className="settings my-days">
      {/* Looking back, with the way to now always at hand, on the title's far right. */}
      <div className="my-days-head">
        <h1 className="settings-title">my days</h1>
        <button className="my-days-today" onClick={onToday}>
          today
          <Chevron dir="right" />
        </button>
      </div>
      {/* squared's line, the page's epigraph: what follows is the past; today is beside it. The tagline candidate. */}
      <p className="my-days-line">The past is painted. Today is still yours.</p>
      {/* Before the squares are set: a ghost of the bar (lived solid, ahead dotted, today between), so it's clear
          what's waiting, then the question and "set up now". */}
      {!profile && (
        <button className="home-card my-days-life is-empty" onClick={onSetUp}>
          <span className="home-head">a life</span>
          <span className="home-big is-ahead is-ghost">
            ?<small>days</small>
          </span>
          <span className="life-ghost" aria-hidden="true">
            <i />
          </span>
          <span className="life-ghost-legend" aria-hidden="true">
            <span>lived</span>
            <span>today</span>
            <span>ahead</span>
          </span>
          <span className="life-ghost-ask">how many squares will you paint?</span>
          <span className="settings-sub is-set-up">{setUp}</span>
        </button>
      )}
      {profile &&
        (() => {
          const c = lifeCounts(profile.born, profile.lifespan, today)
          const lived = Math.round((c.sofar / c.total) * 100)
          return (
            <button
              className="home-card home-life my-days-life"
              onClick={onList}
              aria-label={`a life: ${fmt(c.left)} days ahead`}
            >
              <span className="home-head">
                a life
                <Chevron dir="right" />
              </span>
              {/* Time runs left to right: the past in ink, so the days ahead (the number) sit on the right. */}
              <span className="home-big is-ahead">
                {fmt(c.left)}
                <small>days</small>
              </span>
              {/* Now, on the line: a dot where the days lived meet the days ahead, "today" under it. */}
              <span className="life-track" aria-hidden="true">
                <span className="home-bar">
                  <i style={{ width: `${(c.sofar / c.total) * 100}%` }} />
                </span>
                <i className="life-now" style={{ left: `${(c.sofar / c.total) * 100}%` }} />
              </span>
              <span className="life-now-label" aria-hidden="true">
                <span style={{ left: `clamp(18px, ${(c.sofar / c.total) * 100}%, calc(100% - 18px))` }}>today</span>
              </span>
              <span className="home-legend">
                <span>{lived}% lived</span>
                <span>{100 - lived}% ahead</span>
              </span>
            </button>
          )
        })()}
      {(hasMonth || hasYear) && (
        <section className="home-card home-paintings my-days-paintings">
          {hasMonth && (
            <button onClick={() => onPainting(month)}>
              <span className="home-t">{new Date().toLocaleDateString('en-US', { month: 'long' })}, so far</span>
              <PaintingThumb month={month} days={days} />
              <span className="home-s">{count(month)} days in colour</span>
            </button>
          )}
          {hasYear && (
            <button onClick={() => onPainting(year)}>
              <span className="home-t">{year}, so far</span>
              <PaintingThumb month={year} days={days} />
              <span className="home-s">{count(year)} days in colour</span>
            </button>
          )}
        </section>
      )}
      <div className="settings-rows is-last">
        {matters.length
          ? row('what matters', matters.slice(0, 3).join(' · '), onMatters)
          : row('what matters', setUp, onMatters, 'set up')}
        {profile
          ? row('a life, in squares', 'every day, as a square', onSquares)
          : row('a life, in squares', setUp, onSquares, 'set up')}
        {profile
          ? row('a life, in slices', 'your days, as a pie', onPie)
          : row('a life, in slices', setUp, onPie, 'set up')}
        {framed
          ? row('framed days', 'the days you framed', onFramed)
          : row(
              'framed days',
              'none yet · frame a day you want to keep',
              onFramed,
              'none',
              // A ghost of a framed square: what will hang here.
              <span className="framed-ghost" aria-hidden="true">
                <i />
              </span>,
            )}
        {kept.length
          ? row('paintings', 'the paintings you kept', onPaintings)
          : row(
              'paintings',
              'none yet · keep a month’s painting when it ends',
              onPaintings,
              'none',
              // A ghost of a kept painting, in its frame.
              <span className="framed-ghost is-painting" aria-hidden="true">
                <i />
              </span>,
            )}
      </div>
    </main>
  )
}
