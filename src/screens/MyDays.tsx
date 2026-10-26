import { PaintingThumb } from '../components/PaintingThumb'
import { WeekCard } from '../components/WeekCard'
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
  /** A day of the week card, to open. */
  onDay: (iso: string) => void
  /** "set up now" on the life card, before the squares are set: how many squares, then back here. */
  onSetUp: () => void
  onPainting: (period: string) => void
  onSquares: () => void
  onMatters: () => void
  onFramed: () => void
  onPaintings: () => void
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
  onDay,
  onSetUp,
  onPainting,
  onSquares,
  onMatters,
  onFramed,
  onPaintings,
}: Props) {
  const today = todayIso()
  const month = today.slice(0, 7)
  const year = today.slice(0, 4)
  const count = (p: string) => Object.keys(days).filter((d) => d.startsWith(p) && d <= today).length
  const hasMonth = count(month) > 0
  const hasYear = count(year) > 0
  const framed = Object.values(days).some((d) => d.framed)
  // Each row opens its page; `empty` is an empty slot (dashed). Not set up yet: its sub says what it is, and "set up
  // now" sits at the far right with the arrow.
  const row = (label: string, sub: string, go: () => void, empty?: 'set up' | 'none') => {
    const text = (
      <span className="settings-text">
        <span className="settings-label">{label}</span>
        <span className="settings-sub">{sub}</span>
      </span>
    )
    // Nothing there yet: a quiet line, not a door to a blank page (its sub says how to fill it).
    if (empty === 'none') return <div className="settings-row is-empty is-quiet">{text}</div>
    return (
      <button className={'settings-row' + (empty ? ' is-empty' : '')} onClick={go}>
        {text}
        {empty === 'set up' ? <SetUp /> : <Chevron dir="right" />}
      </button>
    )
  }
  return (
    <main className="settings my-days">
      {/* The logo and the menu already go to today: the title stands alone. */}
      <h1 className="settings-title">my days</h1>
      {/* squared's line, the page's epigraph: what follows is the past; today is beside it. The tagline candidate. */}
      <p className="my-days-line">The past is painted. Today is still yours.</p>
      {/* This week first, the nearest look back (it lived on home, which was cut): swipe or ‹ › for earlier weeks. */}
      <WeekCard days={days} born={profile?.born} onDay={onDay} />
      {/* Before the squares are set: a ghost of the bar (lived solid, ahead dotted, today between), so it's clear
          what's waiting, under the question; "set up now" at the top right, where its arrow will be. */}
      {!profile && (
        <button className="home-card my-days-life is-empty" onClick={onSetUp}>
          <span className="home-head">
            a life
            <SetUp />
          </span>
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
        </button>
      )}
      {profile &&
        (() => {
          const c = lifeCounts(profile.born, profile.lifespan, today)
          const lived = Math.round((c.sofar / c.total) * 100)
          return (
            <button
              className="home-card home-life my-days-life"
              onClick={onSquares}
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
      {/* This month and this year so far, and the way to every painting you kept (the old "paintings" row). */}
      {(hasMonth || hasYear || kept.length > 0) && (
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
          {/* None kept yet: how to keep one, not a door to a blank page. */}
          {kept.length ? (
            <button className="my-days-all" onClick={onPaintings}>
              all my paintings ({kept.length})
              <Chevron dir="right" />
            </button>
          ) : (
            <p className="my-days-all is-quiet">keep a month’s painting once it’s over</p>
          )}
        </section>
      )}
      <div className="settings-rows is-last">
        {matters.length
          ? row('what matters', matters.slice(0, 3).join(' · '), onMatters)
          : row('what matters', 'what makes a day worth it', onMatters, 'set up')}
        {framed
          ? row('framed days', 'the days you framed', onFramed)
          : row('framed days', 'none yet · frame a day you want to keep', onFramed, 'none')}
      </div>
    </main>
  )
}

/** "set up now ›": where the arrow is, on a row or card that isn't set up yet. */
function SetUp() {
  return (
    <span className="set-up-now">
      set up now
      <Chevron dir="right" />
    </span>
  )
}
