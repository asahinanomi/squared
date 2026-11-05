import { useEffect, useMemo, useState } from 'react'
import { FrameDemo } from '../components/FrameDemo'
import { PaintingDemo } from '../components/PaintingDemo'
import { Sheet } from '../components/Sheet'
import { PaintingThumb } from '../components/PaintingThumb'
import { allPaintings, inProgress, monthName } from '../lib/painting'
import { WhereCard } from '../components/WhereCard'
import { plainDate, todayIso } from '../lib/dates'
import { frameOf } from '../lib/paints'
import type { Days } from '../lib/days'
import type { Notes } from '../lib/notes'
import type { Profile } from '../lib/profile'
import { Chevron } from './Today'
import { MAX_CHARS } from '../lib/matters'
import { askFirstTest } from '../state/app'

type Props = {
  days: Days
  profile: Profile | null
  notes: Notes
  /** Notes load a month at a time: the framed day shown needs its month's. */
  loadNotes: (iso: string) => void
  /** Your "mattered" lines (empty until written): the row shows the first few. */
  matters: string[]
  /** A day of this week, to open. */
  onDay: (iso: string) => void
  /** This month, in squares. */
  onMonth: () => void
  /** "see your whole life ›" on the life card, before the squares are set: how many squares, then back here. */
  onSetUp: () => void
  onPainting: (period: string) => void
  onSquares: () => void
  onMatters: () => void
  /** The first line of what matters (worth it), written right here on the card. */
  onAddMatter: (text: string) => void
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
// bar (days lived, days ahead; it opens the list), what matters, your paintings, a life
// in squares, in slices, the days you framed and your paintings. Home stays today, now. Each row is named
// after the page it opens; the page is "my days", so no row says "my".
// There's no onboarding: what isn't there yet waits here. What matters asks its question on the card; no paintings or
// framed days yet, an empty slot (a dashed edge) that says how one is made. The life card, before the squares are set,
// shows a ghost of its bar and "see your whole life ›", so you can see what's coming.
export function MyDays({
  days,
  profile,
  notes,
  loadNotes,
  matters,
  onDay,
  onMonth,
  onSetUp,
  onPainting,
  onSquares,
  onMatters,
  onAddMatter,
  onFramed,
  onPaintings,
}: Props) {
  const today = todayIso()
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
  // The shelf: every painting, in the wall's order (this year so far and its months first, newest first).
  const shelf: [string, string][] = allPaintings(days).map((p) => [
    p,
    (p.length === 4 ? p : monthName(p).slice(0, 3)) + (inProgress(p) ? ', so far' : ''),
  ])
  // What matters, before any line is written: the question itself, on the card (nomi, Nov 3, 2026: asked, not
  // assigned). It stays until a line is written. (A week's and a first red day's questions, once each, were tried the
  // same day and cut: once-and-gone was too weak, and "add this to what matters" in the moment bubble already asks at the
  // true moment.) ?askfirst shows it whatever your lists hold, saving nothing.
  const [testDone, setTestDone] = useState(false)
  const testing = askFirstTest && !testDone
  // Picked once per visit (and again only if the list itself changes, say once it has loaded).
  const line = useMemo(() => (matters.length ? oneOf(matters, 'squared.mattersShown') : ''), [matters.join('\n')]) // eslint-disable-line react-hooks/exhaustive-deps
  // An empty slot (dashed): nothing there yet, its sub says what it is; it opens how to make one.
  const row = (label: string, sub: string, go: () => void) => {
    const text = (
      <span className="settings-text">
        <span className="settings-label">{label}</span>
        <span className="settings-sub">{sub}</span>
      </span>
    )
    return (
      <button className="settings-row is-empty" onClick={go}>
        {text}
        <Chevron dir="right" />
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
      {/* The order: where you are; a line that matters, under the time you have; your paintings (seeing your life, a
          hero); then a day you framed, a memory to end on (nomi, Oct 31, 2026). */}
      {/* What matters, one line at a time: a different one of your own each visit, in the sans of your own words, a
          note to yourself under the time you have. The card opens all of them. Not set yet: the empty slot, as before. */}
      {testing || !matters.length ? (
        <FirstMatter test={testing} onAdd={(t) => (testing ? setTestDone(true) : onAddMatter(t))} />
      ) : (
        <button className="home-card matters-card" onClick={onMatters}>
          <span className="matters-text">
            <span className="matters-label">you said this matters</span>
            <span className="matters-line">{line}</span>
          </span>
          <Chevron dir="right" />
        </button>
      )}
      {/* Your paintings, a shelf (nomi, Oct 31, 2026: seeing your life is a hero, so they sit above the framed day, and
          small, so they take a strip, not half the page): every painting, newest first, side by side; more than fit, the
          shelf scrolls sideways. Each opens its painting; the title opens them all. Nothing painted yet: the empty slot,
          with how a painting is made. */}
      {!shelf.length && (
        <div className="settings-rows">
          {row('paintings', 'none yet · how a painting is made', () => setHelp('paintings'))}
        </div>
      )}
      {shelf.length > 0 && (
        <section className="home-card my-days-paintings">
          <button className="my-days-card-head" onClick={onPaintings}>
            <span className="matters-label">you painted these</span>
            <Chevron dir="right" />
          </button>
          <div className="paintings-shelf">
            {shelf.map(([p, label]) => (
              <button key={p} className="shelf-item" onClick={() => onPainting(p)}>
                <PaintingThumb month={p} days={days} />
                <span>{label}</span>
              </button>
            ))}
          </div>
        </section>
      )}
      {/* A day you framed, as itself: its square in its frame, its date, and its "to remember" moments, as on its list
          card. A different one each visit. The card opens that day (its arrow, as on the matters card); every framed
          day is a quiet text link at the foot, at the right (nomi: "you framed this day ›" read as this day). None yet: the empty slot. */}
      {kept1 ? (
        <section className="home-card framed-card">
          <button className="framed-body" onClick={() => onDay(kept1)}>
            <span className="matters-text">
              <span className="matters-label">you framed this day</span>
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
            </span>
            <Chevron dir="right" />
          </button>
          <button className="framed-all" onClick={onFramed}>
            see all framed days
          </button>
        </section>
      ) : (
        <div className="settings-rows">
          {row('framed days', 'none yet · how to frame a day', () => setHelp('framed'))}
        </div>
      )}
      {/* Help, only when asked for: how a day is framed, how a painting is made. */}
      <Sheet open={help === 'framed'} onClose={() => setHelp(null)}>
        {/* The title is the purpose too. Two columns: the move acted out (the day screen's real framing), and beside it
            a few words. */}
        <h2 className="torn-title">Some days deserve a frame.</h2>
        <div className="help-pair">
          <FrameDemo />
          <div className="help-notes">
            <p>Open a painted day, tap “more”, then “frame it”.</p>
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
            <p>Tap a month’s or a year’s name, with its little picture, to open its painting.</p>
            <p>When it ends, it hangs in my days → paintings, yours to download.</p>
          </div>
        </div>
      </Sheet>
    </main>
  )
}

/**
 * What matters, not written yet: the question on the card, and a box to answer it (the moment box's look). One rule,
 * as every box: leaving it keeps what you wrote (the ✓ above a phone's keyboard, a tap or click away), and so does
 * return; no save button (an "add" was tried, Nov 3, 2026, and taken out for the rule). Kept: "added to what matters
 * ✓" a moment, then the card becomes "you said this matters". No link to the page while it's empty.
 */
function FirstMatter({ onAdd, test }: { onAdd: (text: string) => void; test?: boolean }) {
  const [text, setText] = useState('')
  const [added, setAdded] = useState(false)
  const add = () => {
    const t = text.trim()
    if (!t || added) return
    setAdded(true)
    setTimeout(() => onAdd(t), test ? 2000 : 900) // a test holds its line a little longer, to read it
  }
  return (
    <div className="home-card matters-card matters-ask">
      <span className="matters-text">
        <span className="matters-label">what matters</span>
        <label className="matters-line" htmlFor="first-matter">
          What makes a day worth it to you?
        </label>
        <input
          id="first-matter"
          className="matters-first"
          maxLength={MAX_CHARS}
          placeholder="a walk without my phone…"
          value={text}
          readOnly={added}
          enterKeyHint="done"
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && add()}
          // Leaving the box keeps it, as every writing box does (the ✓ above a phone's keyboard, a tap or click away);
          // return (the keyboard's blue ✓) too. No save button: the one rule (nomi, Nov 3, 2026).
          onBlur={add}
        />
        {added && (
          <span className="matters-added">{test ? 'added ✓ (a test: nothing saved)' : 'added to what matters ✓'}</span>
        )}
      </span>
    </div>
  )
}
