import { useMemo, useState } from 'react'
import { FrameDemo } from '../components/FrameDemo'
import { PaintingDemo } from '../components/PaintingDemo'
import { Sheet } from '../components/Sheet'
import { PaintingThumb } from '../components/PaintingThumb'
import { WhereCard } from '../components/WhereCard'
import { todayIso } from '../lib/dates'
import type { Days } from '../lib/days'
import type { Profile } from '../lib/profile'
import { Chevron } from './Today'

type Props = {
  days: Days
  profile: Profile | null
  /** Your "mattered" lines (empty until written): the row shows the first few. */
  matters: string[]
  /** The paintings you kept (none yet: the row says how to keep one). */
  kept: string[]
  /** A day of this week, to open. */
  onDay: (iso: string) => void
  /** This month, in squares. */
  onMonth: () => void
  /** "set up now" on the life card, before the squares are set: how many squares, then back here. */
  onSetUp: () => void
  onPainting: (period: string) => void
  onSquares: () => void
  onMatters: () => void
  onFramed: () => void
  onPaintings: () => void
}

// One of your "what matters" lines, a different one each visit (never the one shown last time, when there are more).
const LAST = 'squared.mattersShown'
const oneOf = (lines: string[]) => {
  let last: string | null = null
  try {
    last = localStorage.getItem(LAST)
  } catch {
    /* fine without it */
  }
  const pool = lines.length > 1 ? lines.filter((l) => l !== last) : lines
  const pick = pool[Math.floor(Math.random() * pool.length)]
  try {
    localStorage.setItem(LAST, pick)
  } catch {
    /* fine without it */
  }
  return pick
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
  onMonth,
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
  const framedCount = Object.values(days).filter((d) => d.framed).length
  const [help, setHelp] = useState<'framed' | 'paintings' | null>(null)
  // Picked once per visit (and again only if the list itself changes, say once it has loaded).
  const line = useMemo(() => (matters.length ? oneOf(matters) : ''), [matters.join('\n')]) // eslint-disable-line react-hooks/exhaustive-deps
  // Each row opens its page; `empty` is an empty slot (dashed). Not set up yet: its sub says what it is, and "set up
  // now" sits at the far right with the arrow.
  const row = (label: string, sub: string, go: () => void, empty?: 'set up' | 'none') => {
    const text = (
      <span className="settings-text">
        <span className="settings-label">{label}</span>
        <span className="settings-sub">{sub}</span>
      </span>
    )
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
      {/* Where you are: this week, this month and a life (it replaced the life card and the week card). */}
      <WhereCard days={days} profile={profile} onDay={onDay} onMonth={onMonth} onLife={onSquares} onSetUp={onSetUp} />
      {/* What matters, right after a life: the compass first, then the paintings. */}
      {/* What matters, one line at a time: a different one of your own each visit, in the question's serif, a note to
          yourself under the time you have. The card opens all of them. Not set yet: the empty slot, as before. */}
      {matters.length ? (
        <button className="home-card matters-card" onClick={onMatters}>
          <span className="matters-text">
            <span className="matters-label">you said this matters</span>
            <span className="matters-line">{line}</span>
          </span>
          <Chevron dir="right" />
        </button>
      ) : (
        <div className="settings-rows">{row('what matters', 'what makes a day worth it', onMatters, 'set up')}</div>
      )}
      {/* This month and this year so far, and the way to every painting you kept (the old "paintings" row). */}
      {/* Nothing painted yet: the paintings wait as an empty slot, with how they're made. */}
      {!hasMonth && !hasYear && !kept.length && (
        <div className="settings-rows">
          {row('paintings', 'none yet · how a painting is made', () => setHelp('paintings'), 'none')}
        </div>
      )}
      {(hasMonth || hasYear || kept.length > 0) && (
        <section className="home-card home-paintings my-days-paintings">
          <h2 className="home-head my-days-paintings-head">paintings</h2>
          {hasMonth && (
            <button onClick={() => onPainting(month)}>
              <span className="home-t">{new Date().toLocaleDateString('en-US', { month: 'long' })}, so far</span>
              <PaintingThumb month={month} days={days} />
            </button>
          )}
          {hasYear && (
            <button onClick={() => onPainting(year)}>
              <span className="home-t">{year}, so far</span>
              <PaintingThumb month={year} days={days} />
            </button>
          )}
          {/* None kept yet: how to keep one, not a door to a blank page. */}
          {kept.length ? (
            <button className="my-days-all" onClick={onPaintings}>
              all my paintings
              <Chevron dir="right" />
            </button>
          ) : (
            <button className="my-days-all is-quiet" onClick={() => setHelp('paintings')}>
              how to keep a painting
              <Chevron dir="right" />
            </button>
          )}
        </section>
      )}
      <div className="settings-rows">
        {framedCount
          ? row('framed days', 'the days you framed', onFramed)
          : row('framed days', 'none yet · how to frame a day', () => setHelp('framed'), 'none')}
      </div>
      {/* Help, only when asked for: how a day is framed, how a painting is kept. */}
      <Sheet open={help === 'framed'} onClose={() => setHelp(null)}>
        {/* The title is the purpose too. Two columns: the move acted out (the day screen's real framing), and beside it
            a few words. */}
        <h2 className="torn-title">Some days deserve a frame.</h2>
        <div className="help-pair">
          <FrameDemo />
          <div className="help-notes">
            <p>Open a painted day and tap “frame it”.</p>
            <p>You can always unframe it later.</p>
          </div>
        </div>
      </Sheet>
      <Sheet open={help === 'paintings'} onClose={() => setHelp(null)}>
        {/* As framing: the purpose as the title, the move acted out (the app's own painting and pill), notes beside it. */}
        <h2 className="torn-title">Your days, painted by you.</h2>
        <div className="help-pair">
          <PaintingDemo />
          <div className="help-notes">
            <p>Tap a month’s or a year’s name to open its painting.</p>
            <p>When it ends, keep it.</p>
          </div>
        </div>
      </Sheet>
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
