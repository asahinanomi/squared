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
import { MAX_CHARS, type Kind } from '../lib/matters'
import type { Ask } from '../state/useAsked'

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
  /** "set up now" on the life card, before the squares are set: how many squares, then back here. */
  onSetUp: () => void
  onPainting: (period: string) => void
  onSquares: () => void
  onMatters: () => void
  /** How many regret lines are written (the first red day's question waits while there are none). */
  regrets: number
  /** A line of what matters, written right here (worth it, or regret). */
  onAddMatter: (kind: Kind, text: string) => void
  /** The once-only questions: asked already (answered or skipped), and marking one asked. */
  asked: (a: Ask) => boolean
  onAsked: (a: Ask) => void
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
// There's no onboarding: what isn't set up yet waits here, an empty slot (a dashed edge on paper, as for every
// empty slot) that says "set up now". The life card shows a ghost of its bar, so you can see what's coming.
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
  regrets,
  asked,
  onAsked,
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
  // What matters asks, at its moment, one question at a time (nomi, Nov 3, 2026): after a week painted (with a green
  // one), "What made the green ones green?"; after the first red day (and once that's answered or set aside), "What
  // would you regret?". Each once: answered or skipped, never again. Before either, with nothing written: the plain
  // question, which stays until a line is written. A card on my days, never a sheet: it waits, it doesn't interrupt.
  const painted = Object.values(days)
  const ask: { id: Ask | 'first'; kind: Kind; label: string; question: string; hint: string } | null =
    painted.length >= 7 && painted.some((d) => d.color === 'green') && !asked('week')
      ? {
          id: 'week',
          kind: 'meaningful',
          label: 'a week painted',
          question: 'What made the green ones green?',
          hint: 'time with people I love…',
        }
      : painted.some((d) => d.color === 'red' && !d.outOfHands) && !regrets && !asked('red')
        ? {
            id: 'red',
            kind: 'wasted',
            label: 'what matters',
            question: 'What would you regret?',
            hint: 'an evening lost to my phone…',
          }
        : !matters.length
          ? {
              id: 'first',
              kind: 'meaningful',
              label: 'what matters',
              question: 'What makes a day worth it to you?',
              hint: 'a walk without my phone…',
            }
          : null
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
      {/* The order: where you are; a line that matters, under the time you have; your paintings (seeing your life, a
          hero); then a day you framed, a memory to end on (nomi, Oct 31, 2026). */}
      {/* What matters, one line at a time: a different one of your own each visit, in the sans of your own words, a
          note to yourself under the time you have. The card opens all of them. Not set yet: the empty slot, as before. */}
      {ask ? (
        <AskMatter
          key={ask.id}
          label={ask.label}
          question={ask.question}
          hint={ask.hint}
          onAdd={(t) => {
            onAddMatter(ask.kind, t)
            if (ask.id !== 'first') onAsked(ask.id as Ask)
          }}
          onNotNow={ask.id === 'first' ? undefined : () => onAsked(ask.id as Ask)}
        />
      ) : matters.length ? (
        <button className="home-card matters-card" onClick={onMatters}>
          <span className="matters-text">
            <span className="matters-label">you said this matters</span>
            <span className="matters-line">{line}</span>
          </span>
          <Chevron dir="right" />
        </button>
      ) : null}
      {/* Your paintings, a shelf (nomi, Oct 31, 2026: seeing your life is a hero, so they sit above the framed day, and
          small, so they take a strip, not half the page): every painting, newest first, side by side; more than fit, the
          shelf scrolls sideways. Each opens its painting; the title opens them all. Nothing painted yet: the empty slot,
          with how a painting is made. */}
      {!shelf.length && (
        <div className="settings-rows">
          {row('paintings', 'none yet · how a painting is made', () => setHelp('paintings'), 'none')}
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
          {row('framed days', 'none yet · how to frame a day', () => setHelp('framed'), 'none')}
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

/** "set up now ›": where the arrow is, on a row or card that isn't set up yet. */
function SetUp() {
  return (
    <span className="set-up-now">
      set up now
      <Chevron dir="right" />
    </span>
  )
}

/**
 * A question of what matters, asked on the card, not a row to "set up" (nomi, Nov 3, 2026: asked, not assigned). One
 * line is enough; it's kept as you leave the box (or press return). No link to the page while it's empty (nomi:
 * there's nothing to open). The once-only questions have "skip" (nomi: "not now" was unclear, and promised a later that never comes), and never
 * come back.
 */
function AskMatter(props: {
  label: string
  question: string
  hint: string
  onAdd: (text: string) => void
  onNotNow?: () => void
}) {
  const [text, setText] = useState('')
  const keep = () => {
    const t = text.trim()
    if (t) props.onAdd(t)
  }
  return (
    <div className="home-card matters-card matters-ask">
      <span className="matters-text">
        <span className="matters-label">{props.label}</span>
        <label className="matters-line" htmlFor="ask-matter">
          {props.question}
        </label>
        <input
          id="ask-matter"
          className="matters-first"
          maxLength={MAX_CHARS}
          placeholder={props.hint}
          value={text}
          enterKeyHint="done"
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
          onBlur={keep}
        />
        {props.onNotNow && (
          <button className="matters-later" onMouseDown={(e) => e.preventDefault()} onClick={props.onNotNow}>
            skip
          </button>
        )}
      </span>
    </div>
  )
}
