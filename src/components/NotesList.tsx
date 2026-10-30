import { frameVars, PAINTS, type Paint } from '../lib/paints'
import { useEffect, useRef, useState } from 'react'
import type { Note } from '../lib/notes'
import { NoteCard } from './NoteCard'
import { SwipeRow } from './SwipeRow'

type Props = {
  notes: Note[]
  /** A framed day's colour: its pinned notes are "to remember" cards in that paint. */
  framed?: Paint
  onOpen: (n: Note) => void
  /** Paint a moment in its own colour (offered once, right after it's added). */
  onPaint?: (n: Note, color: Paint) => void
  /** A way to add one here (the day screen adds them in its box at the top instead). */
  onAdd?: () => void
  onDelete: (n: Note) => Promise<void>
}

// Show/hide is remembered on this device (a convenience; fine if storage is unavailable). Until you choose, only the
// latest moment shows.
const KEY = 'squared.olderHidden'
const readHidden = () => {
  try {
    return localStorage.getItem(KEY) !== '0'
  } catch {
    return true
  }
}
const writeHidden = (hidden: boolean) => {
  try {
    localStorage.setItem(KEY, hidden ? '1' : '0')
  } catch {
    /* ignore */
  }
}

// A day's notes, newest first: the latest is what counts most (today over the past), and it's always on top, where a
// moment just added lands (it glows once as it arrives). The earlier ones unfold below it, or stay tucked away.
// Every note is a moment you captured: as it happened ("this moment…") or looking back ("because…"), each with its time.
export function NotesList({ notes, framed, onOpen, onPaint, onAdd, onDelete }: Props) {
  // A moment just added: one quiet row under it offers its own colour, once. Tap a dot, or let it fade by itself;
  // it never asks again for that moment (and can still be painted from inside it).
  const [offer, setOffer] = useState<string | null>(null)
  const offered = useRef(new Set<string>())
  useEffect(() => {
    if (!onPaint) return
    const fresh = notes.find(
      (n) => !n.pinned && !n.color && !offered.current.has(n.id) && Date.now() - Date.parse(n.writtenAt) < 4000,
    )
    if (!fresh) return
    offered.current.add(fresh.id)
    setOffer(fresh.id)
  }, [notes, onPaint])
  useEffect(() => {
    if (!offer) return
    const t = setTimeout(() => setOffer(null), 8000)
    return () => clearTimeout(t)
  }, [offer])
  const [hidden, setHidden] = useState(readHidden)
  // Only one row is swiped open at a time. Swipe, then "delete": two deliberate moves, so it deletes at once, with no
  // dialog (as Mail and Notes do; nomi, Oct 27, 2026). Deleting from inside an open moment still asks.
  const [swiped, setSwiped] = useState<string | null>(null)

  const row = (n: Note) => (
    <SwipeRow
      key={n.id}
      open={swiped === n.id}
      onOpenChange={(o) => setSwiped(o ? n.id : null)}
      onDelete={() => void remove(n)}
    >
      <NoteCard
        note={n}
        framed={!!framed}
        onOpen={() => onOpen(n)}
        arriving={Date.now() - Date.parse(n.writtenAt) < 4000}
      />
    </SwipeRow>
  )
  const withOffer = (n: Note) => (
    <div key={n.id} className="note-with-offer">
      {row(n)}
      {offer === n.id && onPaint && (
        <div className="note-offer">
          paint this moment?
          {PAINTS.map((p) => (
            <button
              key={p.id}
              className="paint-dot"
              style={{ background: p.hex }}
              onClick={() => {
                setOffer(null)
                onPaint(n, p.id)
              }}
              aria-label={`Paint this moment ${p.id}`}
            />
          ))}
        </div>
      )}
    </div>
  )

  const remove = async (n: Note) => {
    setSwiped(null)
    try {
      await onDelete(n)
    } catch (e) {
      console.error(e) // the note simply stays
    }
  }
  const toggle = () => {
    writeHidden(!hidden)
    setHidden(!hidden)
  }
  // Pinned notes always come first and always show; then the rest, newest first.
  const pinned = notes.filter((n) => n.pinned)
  const rest = notes.filter((n) => !n.pinned)
  const older = rest.slice(0, -1).reverse()
  const latest = rest.at(-1)
  return (
    <div className="notes" style={framed ? frameVars(framed) : undefined}>
      {/* One control, the count in it: "show all 6 moments" while only the latest shows, "show latest only" when all
          do. Nothing to show or hide (one moment): no header. */}
      {older.length > 0 && (
        <div className="notes-head">
          <button className="notes-toggle" onClick={toggle} aria-expanded={!hidden}>
            {hidden ? `show all ${notes.length} moments` : 'show latest only'}
            {/* Down while there's more to open, up to tuck it away. */}
            <svg width="12" height="12" viewBox="0 0 24 24" aria-hidden="true">
              <path
                d={hidden ? 'M6 9l6 6 6-6' : 'M6 15l6-6 6 6'}
                fill="none"
                stroke="currentColor"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
      )}
      {pinned.map(row)}
      {latest && withOffer(latest)}
      {!hidden && older.map(row)}
      {onAdd && (
        <button className="note-add" onClick={onAdd}>
          add a moment
        </button>
      )}
    </div>
  )
}
