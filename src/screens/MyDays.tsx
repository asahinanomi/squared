import { useEffect, useMemo, useState } from 'react'
import { FrameDemo } from '../components/FrameDemo'
import { PaintingDemo } from '../components/PaintingDemo'
import { Sheet } from '../components/Sheet'
import { PaintingThumb } from '../components/PaintingThumb'
import { WhereCard } from '../components/WhereCard'
import { plainDate, todayIso } from '../lib/dates'
import { frameOf } from '../lib/paints'
import type { Days } from '../lib/days'
import type { Notes } from '../lib/notes'
import type { Profile } from '../lib/profile'
import { Chevron } from './Today'

type Props = {
  days: Days
  profile: Profile | null
  notes: Notes
  /** Notes load a month at a time: the framed day shown needs its month's. */
  loadNotes: (iso: string) => void
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

// One of a few (your "what matters" lines, your framed days), a different one each visit (never the one shown last
// time, when there are more).
const oneOf = (lines: string[], key: string) => {
  let last: string | null = null
  try {
    last = localStorage.getItem(key)
  } catch {
    /* fine without it */
  }
  const pool = lines.length > 1 ? lines.filter((l) => l !== last) : lines
  const pick = pool[Math.floor(Math.random() * pool.length)]
  try {
    localStorage.setItem(key, pick)
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
  notes,
  loadNotes,
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
  // One of the days you framed, a different one each visit, with its note ("to remember", else the latest).
  const framedDays = Object.keys(days).filter((d) => days[d].framed && d <= today)
  const kept1 = useMemo(
    () => (framedDays.length ? oneOf(framedDays, 'squared.framedShown') : ''),
    [framedDays.sort().join()],
  ) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => void (kept1 && loadNotes(kept1)), [kept1]) // eslint-disable-line react-hooks/exhaustive-deps
  // Its "to remember" moments, every one in full; none: its latest moment, cut at 2 lines.
  const keptNotes = kept1 ? (notes[kept1] ?? []) : []
  const toRemember = keptNotes.filter((n) => n.pinned)
  const latest = toRemember.length ? null : keptNotes.at(-1)
  const [help, setHelp] = useState<'framed' | 'paintings' | null>(null)
  // Picked once per visit (and again only if the list itself changes, say once it has loaded).
  const line = useMemo(() => (matters.length ? oneOf(matters, 'squared.mattersShown') : ''), [matters.join('\n')]) // eslint-disable-line react-hooks/exhaustive-deps
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
      {/* What matters, one line at a time: a different one of your own each visit, in the sans of your own words, a
          note to yourself under the time you have. The card opens all of them. Not set yet: the empty slot, as before. */}
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
          {/* The title is the way to every painting you kept (none kept yet: how to keep one, not a blank page). */}
          <button
            className="my-days-card-head my-days-paintings-head"
            onClick={kept.length ? onPaintings : () => setHelp('paintings')}
          >
            <span className="matters-label">you painted these</span>
            <Chevron dir="right" />
          </button>
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
        </section>
      )}
      {/* A day you framed, as itself: its square in its frame, its date, and its "to remember" moments, as on its list
          card. A different one each visit. The day opens that day; the title's arrow, every framed day (nomi: a tap
          on the day expects the day). None yet: the empty slot, as before. */}
      {kept1 ? (
        <section className="home-card framed-card">
          <button className="my-days-card-head" onClick={onFramed}>
            <span className="matters-label">you framed this day</span>
            <Chevron dir="right" />
          </button>
          <button className="framed-body" onClick={() => onDay(kept1)}>
            <span className="framed-day">
              <span
                className="framed-square"
                style={{ '--frame': frameOf(days[kept1].color) } as React.CSSProperties}
                aria-hidden="true"
              />
              {plainDate(kept1)}
            </span>
            {toRemember.map((n) => (
              <span key={n.id} className="framed-note is-whole">
                {n.body}
              </span>
            ))}
            {latest && <span className="framed-note">{latest.body}</span>}
          </button>
        </section>
      ) : (
        <div className="settings-rows">
          {row('framed days', 'none yet · how to frame a day', () => setHelp('framed'), 'none')}
        </div>
      )}
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
